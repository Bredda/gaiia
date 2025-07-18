import { PromptTemplate } from "@langchain/core/prompts";
import {
  AgbConfigurable,
  AgbState,
  formatAgentProfilesWithId,
  formatHistory,
} from "../graph";
import { initChatModel } from "langchain/chat_models/universal";
import { UpdateEvent } from "@/lib/graph/event-types";
import { RunnableConfig } from "@langchain/core/runnables";
import { NextTurnSchema } from "../schemas";

const promptTemplate = PromptTemplate.fromTemplate(`
You are the debate manager in a simulated discussion between AI agents.

Your role is to:
- Observe the conversation.
- Choose the next agent to speak.
- Provide them with a short note to guide their answer (challenge, push, reframe, provoke, etc.).
- Ensure a dynamic debate with divergence and contrasting views.
- Avoid dull consensus or repetition.
- Move toward a conclusion within {{maxIterations}} turns.

Debate topic: 
{{topic}}

List of agents: 
{agents}

Conversation history:
{history}

Maximum iterations: {{maxIterations}}

---

Based on the current state of the discussion, you must now:

1. Select the next agent to speak (only one).
2. Write a short note (1 to 2 sentences) to guide their response.

If you believe the conversation is complete or reaching a dead end, return:

{{
  "routingTowards": "end"
}}
`);

export async function manager(
  state: AgbState,
  config: RunnableConfig<AgbConfigurable>
): Promise<Partial<AgbState>> {
  console.debug("Running manager node with state:", state);

  const model = await initChatModel("gpt-4o", {
    modelProvider: "openai",
    temperature: 0,
  });
  const structuredModel = model.withStructuredOutput(NextTurnSchema);
  const chain = promptTemplate.pipe(structuredModel);

  const response = await chain.invoke({
    topic: state.topic,
    agents: formatAgentProfilesWithId(state.agents),
    history: formatHistory(state.history),
    maxIterations: config.configurable!.maxIterations,
  });

  const nextTurnData = NextTurnSchema.safeParse(response).data;
  const event: UpdateEvent = {
    step: "manager",
    type: "update",
    payload: {
      nextTurnData,
    },
  };
  return { nextTurnData, events: [event] };
}
