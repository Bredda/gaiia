import { z } from "zod";

export const AgentTurnDataSchema = z.object({
  agentId: z.string().describe("ID of the agent who is going to speak"),
  notes: z.string().describe("Notes you may want to provide to the next agent"),
});

export const NextTurnSchema = z.object({
  routingTowards: z
    .enum(["agent", "end"])
    .describe(
      "Indicates whether the next turn is directed towards an agent or ends the debate"
    ),
  nextAgentContext: AgentTurnDataSchema.describe(
    "Data for the next agent turn, if applicable"
  ),
});

export type NextTurnData = z.infer<typeof NextTurnSchema>;
