import fp from "fastify-plugin";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { readFile } from "fs/promises";
import { join } from "path";
import { AccessLevel } from "../types/access";
export default fp(async (fastify) => {
  const pkg = JSON.parse(
    await readFile(join(process.cwd(), "package.json"), "utf-8")
  );

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Gaiia API",
        description: "Toutes les routes backend des modules de démo",
        version: pkg.version,
      },
    },
  });

  await fastify.register(fastifySwaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    staticCSP: true,
  });
});
