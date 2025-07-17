import { useCallback, useRef, useState } from "react";
import { ErrorEvent } from "./event-types";
import { createGraphRunner } from "./create-graph-runner";

interface UseGraphRunnerOptions {
  slug: string;
  onToken?: (token: string) => void;
  onUpdate?: (step: string, payload: unknown) => void;
  onComplete?: () => void;
  onError?: (error: ErrorEvent | Error) => void;
}

export function useGraphRunner<Input>(options: UseGraphRunnerOptions) {
  const abortRef = useRef<() => void>(() => {});
  const [running, setRunning] = useState(false);

  const invoke = useCallback(
    async (input: Input) => {
      if (running) return;

      setRunning(true);

      const { invoke, abort } = createGraphRunner<Input>({
        slug: options.slug,
        onToken: options.onToken,
        onUpdate: options.onUpdate,
        onComplete: () => {
          setRunning(false);
          options.onComplete?.();
        },
        onError: (err) => {
          setRunning(false);
          options.onError?.(err);
        },
      });

      abortRef.current = abort;

      try {
        await invoke(input);
      } catch (err) {
        console.error("Graph invocation failed:", err);
        setRunning(false);
      }
    },
    [options, running]
  );

  const abort = useCallback(() => {
    abortRef.current?.();
    setRunning(false);
  }, []);

  return {
    invoke,
    abort,
    running,
  };
}
