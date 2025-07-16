export type GraphRunner<Input = unknown, Output = unknown> = (
  input: Input,
  callbacks: {
    onToken: (token: string) => void;
    onUpdate: (data: any) => void;
    onDone: (result: Output) => void;
    onError: (err: Error) => void;
  }
) => Promise<void>;
