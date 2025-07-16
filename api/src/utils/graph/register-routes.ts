import type { FastifyInstance } from "fastify";
import { handleGraphSSEStreamed } from "./stream-handler.js";
import { GraphDefinition } from "@shared-types/graph-introspection.js";
import { AccessLevel } from "@shared-types/access.js";
import { StateDefinition, StateType, UpdateType } from "@langchain/langgraph";

/**
 *  Registers a route for streaming graph execution.
 *  This route accepts a POST request with the input schema defined in the graph module.
 *  It transforms the input into the format required by the graph and streams the output.
 * @param app - The Fastify instance to register the route on.
 * @param transformInputToGraphInput - A function that transforms the route input into the graph input format.
 * @param mod - The graph module containing the graph definition, input schema, and run configuration.
 * @param accessLevel - The access level for the route, defaulting to PUBLIC.
 * @return A Fastify route handler that streams the graph execution results.
 */
export async function registerGraphStreamRoute<
  RouteInput,
  GraphInput extends UpdateType<any>,
  GraphConfigurable extends StateType<StateDefinition>,
>(
  app: FastifyInstance,
  transformInputToGraphInput: (input: RouteInput) => GraphInput,
  mod: GraphDefinition<GraphInput, GraphConfigurable>,
  accessLevel: AccessLevel = AccessLevel.PUBLIC
) {
  app.post("/stream", {
    schema: { body: mod.inputSchema },
    config: { access: accessLevel },
    handler: async (request, reply) => {
      const input = request.body as RouteInput;
      const graphInput = transformInputToGraphInput(input);
      const { graph, runConfig, streamingTags } = mod;
      await handleGraphSSEStreamed<GraphInput, GraphConfigurable>(
        reply,
        graph,
        graphInput,
        runConfig,
        streamingTags
      );
    },
  });
}

/**
 *  Registers a route for introspecting the graph.
 *  This route returns the graph's metadata and a Mermaid diagram representation.
 * @param app  - The Fastify instance to register the route on.
 * @param mod  - The graph module containing the graph definition and metadata.
 * @param accessLevel  - The access level for the route, defaulting to PUBLIC.
 * @returns A Fastify route handler that introspects the graph and returns its metadata.
 */
export async function registerGraphIntrospectRoute(
  app: FastifyInstance,
  mod: GraphDefinition<any, any>,
  accessLevel: AccessLevel = AccessLevel.PUBLIC
) {
  app.get("/introspect", {
    config: { access: accessLevel },
    handler: async () => {
      const graph = await mod.graph.getGraphAsync();
      return {
        ...mod.meta,
        mermaid: graph.drawMermaid(),
      };
    },
  });
}
