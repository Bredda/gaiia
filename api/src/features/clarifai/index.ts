import { FastifyInstance } from "fastify";
import { buildGraph } from "./graph/graph.js";
import {
  registerGraphIntrospectRoute,
  registerGraphStreamRoute,
} from "@utils/graph/register-routes.js";
import { ClarifaiConfigurable } from "./graph/schema.js";

const clarifiaModule = {
  path: "/clarifia",
  graph: buildGraph(),
  inputSchema: {
    type: "object",
    properties: {
      content: { type: "string" },
    },
    required: ["content"],
  },
  runConfig: {
    claimVerificationSource: "web" as const,
    extractClaimsModel: { provider: "openai" as const, model: "gpt-4o-mini" },
    verifyClaimsModel: { provider: "openai" as const, model: "gpt-4o-mini" },
    biasDetectionModel: { provider: "openai" as const, model: "gpt-4o-mini" },
    agregationModel: { provider: "openai" as const, model: "gpt-4o-mini" },
    segmentationMode: "recursive" as const,
    segmentsChunkSize: 1000,
  },
  meta: {
    id: "clarifai",
    description:
      "Analyse de texte : vérification factuelle, détection de biais, résumé",
    version: "1.0.0",
    tags: ["fact-checking", "bias", "summary"],
    inputs: {
      content: "string",
    },
    models: ["gpt-4o-mini"],
  },
};

type ClarifiaRouteInput = {
  content: string;
};
type ClarifiaGraphInput = {
  originalContent: string;
};

export async function clarifaiRoute(app: FastifyInstance) {
  await registerGraphStreamRoute<
    ClarifiaRouteInput,
    ClarifiaGraphInput,
    ClarifaiConfigurable
  >(
    app,
    (input: ClarifiaRouteInput) => ({
      originalContent: input.content,
    }),
    clarifiaModule
  );
  await registerGraphIntrospectRoute(app, clarifiaModule);
}
