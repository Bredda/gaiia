import { StreamEvent, UpdateEvent } from "@/lib/graph/event-types";
import { arrayStateReducer } from "@/lib/graph/state-utils";
import { RunnableConfig } from "@langchain/core/runnables";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { AgentTurn } from "../use-agb-store";
import { NextTurnData } from "./schemas";
import { manager } from "./nodes/manager";
import { genericAgent } from "./nodes/agent";
import { AgentProfile } from "../agents";

const AgbAnnotation = Annotation.Root({
  topic: Annotation<string>(), // Initial input from caller
  agents: Annotation<AgentProfile[]>(arrayStateReducer), // Cleaned content after preprocessing
  history: Annotation<AgentTurn[]>(arrayStateReducer), // Segments of the content
  events: Annotation<StreamEvent[]>(arrayStateReducer), // Event for ui display
  nextTurnData: Annotation<NextTurnData>,
});

export type AgbState = typeof AgbAnnotation.State;

export const AgbConfigurableAnnotation = Annotation.Root({
  maxIterations: Annotation<number>,
});
export type AgbConfigurable = typeof AgbConfigurableAnnotation.State;

export function formatHistory(history: AgentTurn[]): string {
  return history.map((turn) => `${turn.name}: ${turn.message}`).join("\n");
}

export function formatAgentProfile(profile: AgentProfile): string {
  return `**${profile.name}** archetype: ${profile.archetype}, personality: (${profile.personality})\nStyle: ${profile.style}`;
}
export function formatAgentProfileWithId(profile: AgentProfile): string {
  return `**${profile.name}** id: ${profile.id}, archetype: ${profile.archetype}, personality: (${profile.personality})\nStyle: ${profile.style}`;
}
export function formatAgentProfiles(profiles: AgentProfile[]): string {
  return profiles.map((profile) => formatAgentProfile(profile)).join("\n\n");
}
export function formatAgentProfilesWithId(profiles: AgentProfile[]): string {
  return profiles
    .map((profile) => formatAgentProfileWithId(profile))
    .join("\n\n");
}
function routeConversation(
  state: AgbState,
  config: RunnableConfig<AgbConfigurable>
) {
  return state.nextTurnData.routingTowards;
}

const workflow = new StateGraph(AgbAnnotation, AgbConfigurableAnnotation)
  .addNode("manager", manager)
  .addNode("generic_agent", genericAgent)

  .addEdge(START, "manager")
  .addConditionalEdges("manager", routeConversation, {
    end: END,
    agent: "generic_agent",
  })

  .addEdge("generic_agent", "manager");

export const aiGtoBeefGraphMetadata = {
  graph: workflow.compile(),
  defaultConfig: { maxIterations: 10 },
  streamingNodeTags: ["agent"],
};
