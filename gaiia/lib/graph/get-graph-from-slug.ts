import { clarifaiGraphMetadata } from "@/app/(features)/clarifai/ai/graph";
import { CompiledStateGraph } from "@langchain/langgraph";

/**
 * Langgraph metadata for a specific graph identified by its slug.
 * This metadata includes the compiled graph, default configuration, and tags of streaming nodes.
 */
export type GraphMetadata = {
  graph: CompiledStateGraph<any, any, any, any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  defaultConfig: Record<string, unknown>;
  streamingNodeTags: string[];
};

const GRAPH_MAP: Record<string, GraphMetadata> = {
  clarifai: clarifaiGraphMetadata,
};

/**
 *  Retrieves the graph metadata by its slug.
 *  Throws an error if the graph is not found.
 * @param slug  - The slug of the graph to retrieve.
 * @throws {Error} If the graph is not found for the given slug.
 * @returns  {GraphMetadata} The metadata of the graph associated with the slug.
 */
export function getGraphBySlug(slug: string) {
  const graph = GRAPH_MAP[slug as keyof typeof GRAPH_MAP];
  if (!graph) throw new Error(`Graph not found for slug: ${slug}`);
  return graph;
}
