import type { FastifyReply } from "fastify";
import {
  CompiledStateGraph,
  StateDefinition,
  StateType,
  UpdateType,
} from "@langchain/langgraph";
import { GraphEvent } from "@shared-types/graph-events.js";

/**
 *  Handles streaming of graph execution results over Server-Sent Events (SSE).
 *  This function writes the graph execution results to the response in a format suitable for SSE.
 * @param reply - The Fastify reply object to write the SSE response to.
 * @param graph  - The compiled state graph to execute.
 * @param input  - The input to the graph execution, transformed to the graph's input format.
 * @param runConfig  - Optional configuration for the graph execution.
 * @param streamingTags  - Optional graph node tags to filter the token to stream.
 */
export async function handleGraphSSEStreamed<
  GraphInput extends UpdateType<any>,
  GraphConfigurable extends StateType<StateDefinition>,
>(
  reply: FastifyReply,
  graph: CompiledStateGraph<any, any, any, any, any>,
  input: GraphInput,
  runConfig: GraphConfigurable,
  streamingTags: string[] = []
) {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (event: GraphEvent, done = false) => {
    reply.raw.write(`data: ${JSON.stringify({ event, done })}\n\n`);
  };

  const controller = new AbortController();
  const signal = controller.signal;

  try {
    for await (const chunk of await graph.stream(input, {
      streamMode: ["updates", "messages"],
      signal,
      configurable: runConfig,
    })) {
      if (chunk[0] === "messages") {
        const [message, metadata] = chunk[1];
        if (
          metadata?.tags?.some((tag: string) => streamingTags.includes(tag)) &&
          message?.text
        ) {
          send({
            stepId: "token",
            label: message.text,
            payload: message.text,
          });
        }
      } else if (chunk[0] === "updates") {
        const eventData = chunk[1];
        const nodeKey = Object.keys(eventData)[0];
        const nodePayload = eventData[nodeKey as keyof typeof eventData];
        if (nodePayload?.events?.length) {
          send(nodePayload.events[0] as GraphEvent);
        }
      }
    }

    send({ stepId: "[DONE]", label: "Pipeline terminé", payload: {} }, true);
    reply.raw.end();
  } catch (err: any) {
    console.error("[GraphSSE] execution error", err);
    controller.abort();
    reply.raw.write(`event: error\ndata: ${err.message}\n\n`);
    reply.raw.end();
  }
}
