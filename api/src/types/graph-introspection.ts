import {
  CompiledStateGraph,
  StateDefinition,
  StateType,
  UpdateType,
} from "@langchain/langgraph";

export type GraphMetadata = {
  id: string;
  description?: string;
  version?: string;
  tags?: string[];
  inputs?: Record<string, any>;
  models?: string[];
};

export type GraphDefinition<
  GraphInput extends UpdateType<any>,
  GraphConfigurable extends StateType<StateDefinition>,
> = {
  path: string;
  graph: CompiledStateGraph<any, any, any, any, any>;
  runConfig: GraphConfigurable;
  streamingTags?: string[];
  inputSchema: any; // JSON schema (ou zod + toJSON plus tard)
  meta: GraphMetadata;
};
