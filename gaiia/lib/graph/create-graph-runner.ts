import { fetchEventSource } from "@microsoft/fetch-event-source";
import { StreamEvent, ErrorEvent } from "./event-types";

interface GraphRunnerOptions {
  slug: string;
  onToken?: (token: string) => void;
  onUpdate?: (step: string, eventPayload: unknown) => void;
  onComplete?: () => void;
  onError?: (event: ErrorEvent | Error) => void;
}

/**
 * Creates a Graph runner that handles streamed SSE events from an endpoint exposing a Langgraph invocation.
 * It allows you to run a graph with a given input and handle various events such as tokens, updates, completion, and errors.
 *
 * @param options
 * @param options.slug - The slug of the endpoint for the graph to run.
 * @param options.onToken - Callback for token events.
 * @param options.onUpdate - Callback for update events.
 * @param options.onComplete - Callback for completion events.
 * @param options.onError - Callback for error events.
 * @returns
 */
export function createGraphRunner<Input>(options: GraphRunnerOptions) {
  const abortController = new AbortController();

  async function invoke(input: Input) {
    console.log("Graph stream started with content:", input);
    await fetchEventSource(`/api/graph/${options.slug}/stream`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      openWhenHidden: false,

      signal: abortController.signal,
      async onopen(res) {
        if (
          res.ok &&
          res.headers.get("content-type")?.includes("text/event-stream")
        ) {
          return;
        }
        throw new Error(`❌ Unexpected response: ${res.status}`);
      },
      onmessage(ev) {
        try {
          const data: StreamEvent = JSON.parse(ev.data);
          switch (data.type) {
            case "token":
              options.onToken?.(data.token);
              break;
            case "update":
              options.onUpdate?.(data.step, data.payload);
              break;
            case "complete":
              options.onComplete?.();
              break;
            case "error":
              options.onError?.(data as ErrorEvent);
              break;
          }
        } catch (err) {
          console.error(
            "❌ Failed to parse SSE message, aborting stream",
            ev.data,
            err
          );
          options.onError?.(
            err instanceof Error ? err : new Error(String(err))
          );
        }
      },
      onerror(ev) {
        abortController.abort();
        const error =
          ev instanceof Error
            ? ev
            : new Error(
                `❌ SSE stream error: ${ev.message || "Unknown error"}`
              );
        console.error("Error on SSE stream", error);
        options.onError?.(error);
        throw error;
      },
      onclose() {
        console.log("🔗 SSE connection closed");
      },
    });
  }

  return { invoke, abort: () => abortController.abort() };
}
