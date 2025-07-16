import fp from "fastify-plugin";
import { AccessLevel } from "../types/access";

export default fp(async (fastify) => {
  fastify.decorateRequest("accessLevel", AccessLevel.PUBLIC);

  fastify.addHook("onRequest", async (request, reply) => {
    const isPublicPath =
      request.url.startsWith("/docs") ||
      request.url.startsWith("/documentation/json") ||
      request.url.startsWith("/documentation/yaml");

    if (isPublicPath) return;

    const access: AccessLevel =
      request.routeOptions.config?.access ?? AccessLevel.PRIVATE;

    request.accessLevel = access;
    if (access === AccessLevel.PUBLIC) return;

    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      if (access === AccessLevel.LIMITED) return;
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const supabase = fastify.supabase;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      if (access === AccessLevel.LIMITED) return;
      return reply.status(401).send({ error: "Invalid token" });
    }

    request.user = {
      id: data.user.id,
      email: data.user.email!,
      ...data.user.user_metadata,
    };
  });
});
