import { PromptTemplate } from "@langchain/core/prompts";
import { ClarifaiConfigurable, ClarifaiState } from "../graph";
import { initChatModel } from "langchain/chat_models/universal";
import { StreamEvent } from "@/lib/graph/event-types";
import { VerifiedClaimListSchema } from "../schemas";
import { RunnableConfig } from "@langchain/core/runnables";

const promptTemplate = PromptTemplate.fromTemplate(`
Tu es un assistant chargé d’évaluer la véracité d’affirmations factuelles. Pour chaque affirmation, tu dois :

1. Indiquer si elle est globalement vraie, fausse, partiellement vraie, ou non vérifiable.
2. Donner une explication brève et factuelle.
3. Si possible, citer la source ou la connaissance utilisée.

Voici la liste des affirmations à analyser :
{claims}
]
  `);

export async function verifyClaimsLlm(
  state: ClarifaiState,
  config: RunnableConfig<ClarifaiConfigurable>
): Promise<Partial<ClarifaiState>> {
  console.debug("Verrifying claims throught LLM...");

  const model = await initChatModel(config.configurable!.verifyClaimsModel, {
    modelProvider: "openai",
    temperature: 0,
  });
  const structuredModel = model.withStructuredOutput(VerifiedClaimListSchema);
  const chain = promptTemplate.pipe(structuredModel);

  const response = await chain.invoke({
    claims: state.extractedClaims
      .map(
        (claim) => `segmentId: ${claim.segmentId} - content: ${claim.content} `
      )
      .join("\n"),
  });

  const verifiedClaims =
    VerifiedClaimListSchema.safeParse(response).data?.claims || [];

  const event: StreamEvent = {
    step: "verifyClaims",
    type: "update",
    payload: {
      claims: verifiedClaims,
    },
  };

  return { verifiedClaims, events: [event] };
}
