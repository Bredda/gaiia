import { AccessLevel } from "@shared-types/access";
import { FastifyInstance } from "fastify";
import { readFile } from "fs/promises";
import { join } from "path";

export async function healthRoute(app: FastifyInstance) {
  const pkg = JSON.parse(
    await readFile(join(process.cwd(), "package.json"), "utf-8")
  );

  app.get("/health", {
    config: {
      access: AccessLevel.PUBLIC,
    },
    schema: {
      description: "Check the health of the API",
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            version: { type: "string" },
            timestamp: { type: "string" },
          },
        },
      },
    },
    handler: async () => {
      return {
        status: "ok",
        version: pkg.version,
        timestamp: new Date().toISOString(),
      };
    },
  });
}
