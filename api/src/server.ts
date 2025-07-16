import "dotenv/config";
import Fastify from "fastify";
import { supabasePlugin, accessPlugin, swaggerPlugin } from "@plugins/index.js";
import { healthRoute, userRoute, clarifaiRoute } from "./features";
import { setLogger } from "./logger.js";

const app = Fastify({ logger: true });
setLogger(app.log);
await app.register(supabasePlugin);
await app.register(accessPlugin);
await app.register(swaggerPlugin);

await app.register(
  async (api) => {
    await api.register(healthRoute);
    await api.register(userRoute, { prefix: "/user" });
    await api.register(clarifaiRoute, { prefix: "/clarifai" });
  },
  { prefix: "/api" }
);

app.listen({ port: 3001 }).then(() => {
  console.log("🚀 API running at http://localhost:3001");
});
