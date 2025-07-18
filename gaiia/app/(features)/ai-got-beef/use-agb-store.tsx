// stores/clarifStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createGraphRunner } from "@/lib/graph/create-graph-runner";
import { AgentProfile, AGENTS_PROFILES } from "./agents";

type AgbGraphInput = {
  topic: string;
  agents: AgentProfile[];
};

export type AgentTurn = {
  agentId: string;
  name: string;
  message: string;
};

type AgbState = {
  topic: string;
  agents: AgentProfile[];
  turns: AgentTurn[];
  running: boolean;
  error: any;
  startDebate: (input: AgbGraphInput) => void;
  abort: () => void;
};

export const useAgbStore = create<AgbState>()(
  persist(
    (set, get) => ({
      topic: "",
      agents: [],
      turns: [],
      running: false,
      error: null,

      startDebate: async (input: AgbGraphInput) => {
        console.log("Starting debate with input:", input);
        const { invoke, abort } = createGraphRunner<AgbGraphInput>({
          slug: "ai-got-beef",
          onToken: (token, tags) => {
            console.log("Token received:", token, "Tags:", tags);

            const agentIdTag = tags.find((t) => t.startsWith("agentId:"));
            const agentNameTag = tags.find((t) => t.startsWith("agentName:"));
            if (!agentIdTag || !agentNameTag) return;

            const agentId = agentIdTag.split(":")[1];
            const agentName = agentNameTag.split(":")[1];
            // Accès à ton store (ex: Zustand ou autre)
            const turns = get().turns;

            const lastTurn = turns[turns.length - 1];

            if (lastTurn && lastTurn.agentId === agentId) {
              // Ajouter le token au message courant
              lastTurn.message += token;
              set({ turns: [...turns.slice(0, -1), lastTurn] });
            } else {
              // Nouveau tour de prise de parole
              const newTurn: AgentTurn = {
                agentId,
                name: agentName,
                message: token,
              };
              set({ turns: [...turns, newTurn] });
            }
          },
          onError: (error) => set({ error }),
          onComplete: () => console.log("✔️ done"),
          onUpdate: (step, payload) => {
            console.log("Update received:", step, payload);
          },
        });

        set({
          running: true,
          topic: input.topic,
          agents: input.agents,
          turns: [],
        });

        try {
          await invoke(input);
          set({ running: false });
        } catch (err) {
          console.error("Error during ai-got-beef:", err);
          set({
            error: err,
            running: false,
          });
        }
      },
      abort: () => {
        // Implement abort logic if needed
      },
    }),
    {
      name: "agb-storage",
    }
  )
);
