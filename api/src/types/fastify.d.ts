import "fastify";
import { AccessLevel } from "./access";
import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseUser } from "./user";

declare module "fastify" {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }

  interface FastifyContextConfig {
    access?: AccessLevel;
  }

  interface FastifyRequest {
    accessLevel?: AccessLevel;
    supabase: SupabaseClient;
    user: SupabaseUser;
  }
}
