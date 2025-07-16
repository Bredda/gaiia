import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ClarifaiConfigurable, ClarifaiState } from "../schema";
import { RunnableConfig } from "@langchain/core/runnables";
import { GraphEvent } from "@shared-types/graph-events";
import { getLogger } from "logger";

export async function preprocess(
  state: ClarifaiState,
  config: RunnableConfig<ClarifaiConfigurable>
): Promise<Partial<ClarifaiState>> {
  getLogger().info(
    `Preprocessing content: ${state.originalContent.slice(0, 100)}...`
  );
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.configurable!.segmentsChunkSize,
    chunkOverlap: 0,
  });
  const chunks = await splitter.splitText(state.originalContent);

  const segments = chunks.map((content, index) => ({
    id: index,
    content,
  }));

  const event: GraphEvent = {
    stepId: "preprocess",
    label: "Content preprocessed",
    payload: {
      segments,
    },
  };

  return { segments, cleanedContent: state.originalContent, events: [event] };
}
