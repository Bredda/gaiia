// stores/clarifStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createGraphRunner } from "@/lib/graph/create-graph-runner";
import { ClarifaiStreamInput } from "./ai/graph";

export type AnnotationClaimData = {
  content: string;
  verdict: string;
  explanation: string;
  extractionExplanation: string;
  sources: string[];
  verified: boolean;
  index: number;
};

export type AnnotationBiasData = {
  content: string;
  biasType: string;
  explanation: string;
  typeExplanation: string;
};

export type Annotation =
  | {
      type: "bias";
      start: number;
      end: number;
      data: AnnotationBiasData;
    }
  | {
      type: "claim";
      start: number;
      end: number;
      data: AnnotationClaimData;
    };

export interface ContentChunk {
  id: string;
  content: string;
  annotations: Annotation[]; // ← nouveau
}

export type GraphStep =
  | "preprocessing"
  | "detecting_biases"
  | "extracting_claims"
  | "verifying_claims"
  | "generating_report";
export type GraphStepStatus = "todo" | "in-progress" | "done" | "error";

export type GraphLogUpdate = {
  stepId: GraphStep;
  status: GraphStepStatus;
};

const fullyDoneGraphLog: Record<GraphStep, GraphStepStatus> = {
  preprocessing: "done",
  detecting_biases: "done",
  extracting_claims: "done",
  verifying_claims: "done",
  generating_report: "done",
};

const startClarifygraphLog: Record<GraphStep, GraphStepStatus> = {
  preprocessing: "in-progress",
  detecting_biases: "todo",
  extracting_claims: "todo",
  verifying_claims: "todo",
  generating_report: "todo",
};

type ClarifState = {
  chunks: ContentChunk[];
  extractedClaimsLength: number;
  extractedBiasesLength: number;
  hasSubmitted: boolean;
  processing: boolean;
  report: string | null;
  error: any;
  clarify: (input: ClarifaiStreamInput) => Promise<void>;
  updateGraphLog: (updates: GraphLogUpdate[]) => void;
  setFullReport: (report: string) => void;
  updateReportToken: (token: string) => void;
  reset: () => void;
  graphLog: typeof startClarifygraphLog;
};

export const useClarifaiStore = create<ClarifState>()(
  persist(
    (set, get) => ({
      chunks: [],
      hasSubmitted: false,
      processing: false,
      extractedClaimsLength: 0,
      extractedBiasesLength: 0,
      error: null,
      report: null,
      graphLog: fullyDoneGraphLog,

      clarify: async (input: ClarifaiStreamInput) => {
        const { invoke, abort } = createGraphRunner<ClarifaiStreamInput>({
          slug: "clarifai",
          onToken: (token) =>
            set((state) => ({
              report: state.report ? state.report + token : token,
            })),
          onError: (error) => set({ error }),
          onComplete: () => console.log("✔️ done"),
          onUpdate: (step, payload) => {
            switch (step) {
              case "preprocess": {
                const { segments } = payload as any;
                const newChunks = segments.map((segment: any) => ({
                  id: segment.id,
                  content: segment.content,
                  annotations: [],
                }));

                get().updateGraphLog([
                  { stepId: "preprocessing", status: "done" },
                  { stepId: "extracting_claims", status: "in-progress" },
                  { stepId: "detecting_biases", status: "in-progress" },
                ]);

                set((state) => ({
                  chunks: [...state.chunks, ...newChunks],
                }));
                break;
              }
              case "detectBiases": {
                const { biases } = payload as any;
                get().updateGraphLog([
                  { stepId: "detecting_biases", status: "done" },
                ]);

                set((state) => ({
                  extractedBiasesLength: biases.length,
                  chunks: state.chunks.map((chunk) => {
                    // Filter biases relevant to this chunk
                    const relevantBiases = biases.filter(
                      (bias: any) => bias.segmentId === chunk.id
                    );
                    if (relevantBiases.length === 0) return chunk;

                    const newAnnotations = relevantBiases
                      .map((bias: any) => {
                        const start = chunk.content.indexOf(bias.content);
                        const end = start + bias.content.length;
                        if (start === -1) {
                          console.warn(
                            "bias substring not found:",
                            bias.content
                          );
                          return null;
                        }
                        return {
                          start,
                          end,
                          type: "bias" as const,
                          data: bias,
                        };
                      })
                      .filter((x: any) => x !== null);
                    console.debug("New bias annotations:", newAnnotations);
                    return {
                      ...chunk,
                      annotations: [...chunk.annotations, ...newAnnotations],
                    };
                  }),
                }));
                break;
              }
              case "extractClaims": {
                const { claims } = payload as any;

                get().updateGraphLog([
                  { stepId: "extracting_claims", status: "done" },
                  { stepId: "verifying_claims", status: "in-progress" },
                ]);
                console.debug("Claims extracted:", claims);
                set((state) => ({
                  extractedClaimsLength: claims.length,
                }));
                break;
              }
              case "verifyClaims": {
                // à implémenter proprement selon payload (claims enrichis ?)
                const { claims } = payload as any;
                console.debug("Verified claims:", claims);
                get().updateGraphLog([
                  { stepId: "verifying_claims", status: "done" },
                ]);
                set((state) => ({
                  chunks: state.chunks.map((chunk) => {
                    const relevantClaims = claims.filter(
                      (claim: any) =>
                        claim.segmentId.toString() === chunk.id.toString()
                    );
                    console.debug("Matching claims to chunk:", {
                      chunkId: chunk.id,
                      chunkContent: chunk.content,
                      allClaimSegmentIds: claims.map((c: any) => c.segmentId),
                    });
                    if (relevantClaims.length === 0) return chunk;

                    const newAnnotations = relevantClaims
                      .map((claim: any) => {
                        const start = chunk.content.indexOf(claim.content);
                        const end = start + claim.content.length;
                        if (start === -1) {
                          console.warn(
                            "claim substring not found:",
                            claim.content
                          );
                          return null;
                        }
                        return {
                          start,
                          end,
                          type: "claim" as const,
                          data: claim,
                        };
                      })
                      .filter((x: any) => x !== null);
                    return {
                      ...chunk,
                      annotations: [...chunk.annotations, ...newAnnotations],
                    };
                  }),
                }));

                break;
              }
              case "reporter": {
                get().updateGraphLog([
                  { stepId: "generating_report", status: "done" },
                ]);
                break;
              }
            }
          },
        });

        set({
          hasSubmitted: true,
          processing: true,
          error: null,
          chunks: [],
          graphLog: startClarifygraphLog,
        });

        try {
          await invoke(input);
          set({ processing: false });
        } catch (err) {
          console.error("Error during clarify:", err);
          set({
            error: err,
            processing: false,
            graphLog: startClarifygraphLog,
          });
        }
      },
      setFullReport: (report: string) => {
        set({ report });
      },
      updateReportToken: (token: string) => {
        set((state) => ({
          report: state.report ? state.report + token : token,
        }));
      },

      updateGraphLog: (updates) => {
        const currentLog = get().graphLog;
        const newLog = { ...currentLog };

        updates.forEach(({ stepId, status }) => {
          if (newLog[stepId as GraphStep] !== undefined) {
            newLog[stepId as GraphStep] = status;
          }
        });
        // Claims and biases are parallel steps and reduced to report generation
        // So we have to handle report generation status by ourself here
        if (
          newLog.generating_report === "todo" &&
          newLog.verifying_claims === "done" &&
          newLog.detecting_biases === "done"
        ) {
          newLog.generating_report = "in-progress";
        }

        set({ graphLog: newLog });
      },

      reset: () =>
        set({
          hasSubmitted: false,
          processing: false,
          extractedClaimsLength: 0,
          extractedBiasesLength: 0,
          report: null,
          error: null,
          chunks: [],
        }),
    }),
    {
      name: "clarifai-storage",
    }
  )
);
