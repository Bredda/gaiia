import { Annotation, StateGraph, START } from "@langchain/langgraph";
import {
  ExtractedBias,
  ExtractedClaim,
  ExtractedSegment,
  ExtractedVerifiedClaim,
} from "./schemas";
import { detectBiases } from "./nodes/detectBiases";
import { extractClaims } from "./nodes/extractClaims";
import { preprocess } from "./nodes/preprocess";
import { reporter } from "./nodes/reporter";
import { verifyClaimsLlm } from "./nodes/verifyClaimsLlm";
import { verifyClaimsWeb } from "./nodes/verifyClaimsWeb";
import { StreamEvent } from "@/lib/graph/event-types";
import { RunnableConfig } from "@langchain/core/runnables";

const arrayReducer = <T>(left: T[], right: T[]) => left.concat([...right]);
const defaultArray = <T>() => [] as T[];
const arrayOptions = {
  reducer: arrayReducer,
  default: defaultArray,
};

export type ClarifaiStreamInput = {
  content: string;
};

const ClarifyAnnotation = Annotation.Root({
  content: Annotation<string>(), // Initial input from caller
  cleanedContent: Annotation<string>(), // Cleaned content after preprocessing
  segments: Annotation<ExtractedSegment[]>(arrayOptions), // Segments of the content
  extractedBiases: Annotation<ExtractedBias[]>(arrayOptions), // Biases detected in the content
  extractedClaims: Annotation<ExtractedClaim[]>(arrayOptions), // Claims extracted from the content
  verifiedClaims: Annotation<ExtractedVerifiedClaim[]>(arrayOptions), // Model used for claims verification
  report: Annotation<string>(), // Final answer to the query
  events: Annotation<StreamEvent[]>(arrayOptions), // Event for ui display
});

export const ClarifaiConfigurableAnnotation = Annotation.Root({
  claimVerificationSource: Annotation<"web" | "llm">(),
  extractClaimsModel: Annotation<string>(),
  verifyClaimsModel: Annotation<string>(),
  biasDetectionModel: Annotation<string>(),
  agregationModel: Annotation<string>(),
  segmentationMode: Annotation<"recursive" | "semantic">(),
  segmentsChunkSize: Annotation<number>(),
});

export type ClarifaiState = typeof ClarifyAnnotation.State;
export type ClarifaiConfigurable = typeof ClarifaiConfigurableAnnotation.State;

export const ClarifaiConfigurableDefault: ClarifaiConfigurable = {
  claimVerificationSource: "llm",
  extractClaimsModel: "gpt-4o-mini",
  verifyClaimsModel: "gpt-4o-mini",
  biasDetectionModel: "gpt-4o-mini",
  agregationModel: "gpt-4o-mini",
  segmentationMode: "recursive",
  segmentsChunkSize: 1000,
};

function continueToClaimsVerification(
  state: ClarifaiState,
  config: RunnableConfig<ClarifaiConfigurable>
) {
  // If no claims are extracted, we end the graph. If the configuration specifies web verification, we proceed to that step.
  // Otherwise, we proceed to LLM verification.
  if (state.extractedClaims.length === 0) {
    console.log("No claims extracted, bypassing claims verification.");

    return "no_claims";
  }
  if (config.configurable!.claimVerificationSource === "web") {
    return "verifyClaimsWeb";
  }
  return "verifyClaimsLlm";
}

// Define a new graph
const workflow = new StateGraph(
  ClarifyAnnotation,
  ClarifaiConfigurableAnnotation
)
  .addNode("preprocess", preprocess)
  .addNode("extractClaims", extractClaims)
  .addNode("verifyClaimsWeb", verifyClaimsWeb)
  .addNode("verifyClaimsLlm", verifyClaimsLlm)
  .addNode("detectBiases", detectBiases)
  .addNode("reporter", reporter, { defer: true })

  .addEdge(START, "preprocess")
  .addEdge("preprocess", "extractClaims")
  .addEdge("preprocess", "detectBiases")

  .addConditionalEdges("extractClaims", continueToClaimsVerification, {
    verifyClaimsWeb: "verifyClaimsWeb",
    verifyClaimsLlm: "verifyClaimsLlm",
    no_claims: "reporter",
  })
  .addEdge("verifyClaimsLlm", "reporter")
  .addEdge("verifyClaimsWeb", "reporter")
  .addEdge("detectBiases", "reporter");

export const clarifaiGraphMetadata = {
  graph: workflow.compile(),
  defaultConfig: ClarifaiConfigurableDefault,
  streamingNodeTags: ["reporter"],
};
