export type LLMProvider = "openai" | "fireworks" | "mistral" | "groq";

export type LLMConfig = {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
};
