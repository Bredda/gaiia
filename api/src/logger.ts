import type { FastifyBaseLogger } from "fastify";

let logger: FastifyBaseLogger | null = null;

export function setLogger(log: FastifyBaseLogger) {
  logger = log;
}

export function getLogger(): FastifyBaseLogger {
  if (!logger) throw new Error("Logger not initialized");
  return logger;
}
