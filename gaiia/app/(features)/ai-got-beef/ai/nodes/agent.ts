import { PromptTemplate } from "@langchain/core/prompts";
import {
  AgbConfigurable,
  AgbState,
  formatAgentProfile,
  formatAgentProfiles,
  formatHistory,
} from "../graph";
import { initChatModel } from "langchain/chat_models/universal";
import { UpdateEvent } from "@/lib/graph/event-types";
import { RunnableConfig } from "@langchain/core/runnables";
import { AGENTS_PROFILES } from "../../agents";

const promptTemplate = PromptTemplate.fromTemplate(`
You are an AI agent named **{agentName}**, actively taking part in a live debate on the topic:  
**{topic}**

You are not a narrator. Never describe what is happening. Do not explain the debate. Just speak.

Your personality: **{personality}**  
(Stick to this. It affects how you speak, what you value, and how you argue.)

The debate manager has given you this instruction to guide your next move:  
**"{noteFromManager}"**

Other participants: {agents}

Conversation so far:  
{history}

---

Now write your next message **as {agentName}**, in line with your personality.

✅ Speak directly to the others, with your own tone and opinions.  
✂️ Keep it concise and impactful (2–4 sentences).  
🚫 Never summarize or describe the conversation. No third-person. No setup.  
`);

export async function genericAgent(
  state: AgbState,
  config: RunnableConfig<AgbConfigurable>
): Promise<Partial<AgbState>> {
  console.log("genericAgent invoked with state for turn", state?.nextTurnData);
  const agent = state.agents.find(
    (p) => p.id === state.nextTurnData.nextAgentContext?.agentId
  );

  if (!agent) {
    throw new Error(
      `Agent not found: ${state.nextTurnData.nextAgentContext?.agentId}`
    );
  }

  const model = await initChatModel("gpt-4o-mini", {
    modelProvider: "openai",
    temperature: 0,
  });
  // We had tags to model to stream its token. Tags will be forwareded to the UI with it, so we had agentName to specifiy who produced the token.
  const taggedModel = model.withConfig({
    tags: ["agent", `agentId:${agent.id}`, `agentName:${agent.name}`],
  });

  const response = await promptTemplate.pipe(taggedModel).invoke({
    topic: state.topic,
    agentName: agent.name,
    agents: formatAgentProfiles(state.agents.filter((p) => p.id !== agent.id)),
    noteFromManager: state.nextTurnData.nextAgentContext?.notes || "",
    history: formatHistory(state.history),
    personality: formatAgentProfile(agent),
  });

  const newTurn = {
    agentId: state.nextTurnData.nextAgentContext?.agentId || "unknown", // Assuming agentId is the same as agentName for simplicity
    name: agent.name,
    message: response.content.toString(),
  };

  const event: UpdateEvent = {
    step: `agent`,
    type: "update",
    payload: {
      newTurn,
    },
  };
  return { history: [newTurn], events: [event] };
}
