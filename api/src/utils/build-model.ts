import { LLMConfig } from "@shared-types/llm-config";
import { initChatModel } from "langchain/chat_models/universal";

export async function buildLlmModel(
  config: LLMConfig,
  options?: { structuredOutput?: any }
) {
  const { provider, model } = config;
  const settings: Record<string, any> = {
    modelProvider: provider,
    apiKey: process.env.OPENAI_API_KEY,
  };
  if (config.temperature !== undefined) {
    settings.temperature = config.temperature;
  }
  if (config.max_tokens !== undefined) {
    settings.maxTokens = config.max_tokens;
  }
  if (config.top_p !== undefined) {
    settings.topP = config.top_p;
  }

  const llm = await initChatModel(config.model, settings);

  if (options && options.structuredOutput) {
    return llm.withStructuredOutput(options.structuredOutput);
  } else {
    return llm;
  }
}
