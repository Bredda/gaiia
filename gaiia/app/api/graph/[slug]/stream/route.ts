import { NextRequest } from "next/server";
import { getGraphBySlug } from "@/lib/graph/get-graph-from-slug";
import { UpdateEvent, ErrorEvent, TokenEvent } from "@/lib/graph/event-types";

export const runtime = "edge"; // ou "nodejs" selon ton besoin SSE

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const input = await req.json();
  console.log("Graph stream started with body:", input);
  const crtl = new AbortController();
  const { graph, defaultConfig, streamingNodeTags } = getGraphBySlug(slug);

  function sendTokenEvent(
    controller: ReadableStreamDefaultController<any>,
    encoder: TextEncoder,
    event: Omit<TokenEvent, "type">
  ) {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: "token", ...event })}\n\n`)
    );
  }

  function sendUpdateEvent(
    controller: ReadableStreamDefaultController<any>,
    encoder: TextEncoder,
    event: Omit<UpdateEvent, "type">
  ) {
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ type: "update", ...event })}\n\n`
      )
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of await graph.stream(input, {
          streamMode: ["updates", "messages"],
          configurable: defaultConfig,
          debug: false,
          signal: crtl.signal,
        })) {
          if (chunk[0] === "messages") {
            const [messageChunk, metadata] = chunk[1];
            if (
              !metadata.tags.some((t: string) =>
                streamingNodeTags.includes(t)
              ) ||
              !messageChunk.text
            )
              continue; // Ignore empty messages

            if (messageChunk.text) {
              sendTokenEvent(controller, encoder, {
                token: messageChunk.text,
                tags: metadata.tags,
              });
            }
          } else if (chunk[0] === "updates") {
            const eventData = chunk[1];

            const nodeKey = Object.keys(eventData)[0];
            if (!nodeKey) continue; // No node key found

            const nodePayload = eventData[nodeKey as keyof typeof eventData];
            if (!nodePayload) continue; // No payload found for the node

            if (!nodePayload.events || nodePayload.events.length === 0)
              continue;

            sendUpdateEvent(
              controller,
              encoder,
              nodePayload.events[0] as UpdateEvent
            );
          }
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`)
        );
        controller.close();
      } catch (err: any) {
        console.error("❌ Error in graph stream:", err);
        if (err instanceof AggregateError) {
          console.error("AggregateError details:", err.errors);
        }
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: err.message,
            } as ErrorEvent)}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
