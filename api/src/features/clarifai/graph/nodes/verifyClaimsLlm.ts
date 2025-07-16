import { PromptTemplate } from "@langchain/core/prompts";
import {
  ClarifaiConfigurable,
  ClarifaiState,
  VerifiedClaimListSchema,
} from "../schema";
import { RunnableConfig } from "@langchain/core/runnables";
import { buildLlmModel } from "@utils/build-model";

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

  const structuredModel = await buildLlmModel(
    config.configurable!.verifyClaimsModel,
    {
      structuredOutput: VerifiedClaimListSchema,
    }
  );
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

  const event = {
    stepId: "verifyClaims",
    label: "Claims verified",
    payload: {
      claims: verifiedClaims,
    },
  };

  return { verifiedClaims, events: [event] };
}
