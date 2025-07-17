import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ClarifaiConfigurable, ClarifaiState } from "../graph";
import { UpdateEvent } from "@/lib/graph/event-types";
import { RunnableConfig } from "@langchain/core/runnables";

export async function preprocess(
  state: ClarifaiState,
  config: RunnableConfig<ClarifaiConfigurable>
): Promise<Partial<ClarifaiState>> {
  console.debug("Preprocessing content...");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.configurable!.segmentsChunkSize,
    chunkOverlap: 0,
  });
  const chunks = await splitter.splitText(state.content);

  const segments = chunks.map((content, index) => ({
    id: index,
    content,
  }));

  const event: UpdateEvent = {
    step: "preprocess",
    type: "update",
    payload: {
      segments,
    },
  };

  return { segments, cleanedContent: state.content, events: [event] };
}
