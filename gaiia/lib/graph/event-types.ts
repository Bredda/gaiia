// lib/graph/event-types.ts

export type TokenEvent = { type: "token"; token: string };
export type UpdateEvent = { type: "update"; step: string; payload: unknown };
export type CompleteEvent = { type: "complete"; output: unknown };
export type ErrorEvent = { type: "error"; error: string };

export type StreamEvent = TokenEvent | UpdateEvent | CompleteEvent | ErrorEvent;
