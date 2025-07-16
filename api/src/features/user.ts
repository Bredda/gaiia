import { AccessLevel } from "@shared-types/access";
import { FastifyInstance } from "fastify";

export async function userRoute(app: FastifyInstance) {
  app.get("/me", {
    config: {
      access: AccessLevel.PRIVATE,
    },
    schema: {
      description: "Get the authenticated user's information",
      response: {
        200: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
          },
        },
      },
    },
    handler: async (request, reply) => {
      return { user: request.user };
    },
  });
}
