import { StateGraph, END, START } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import {
  ClarifaiAnnotation,
  ClarifaiConfigurable,
  ClarifaiConfigurableAnnotation,
  ClarifaiState,
} from "./schema";
import {
  detectBiases,
  extractClaims,
  preprocess,
  reporter,
  verifyClaimsLlm,
  verifyClaimsWeb,
} from "./nodes";

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

export function buildGraph() {
  // Define a new graph
  const workflow = new StateGraph(
    ClarifaiAnnotation,
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
    .addEdge("detectBiases", "reporter")
    .addEdge("reporter", END);

  return workflow.compile();
}
