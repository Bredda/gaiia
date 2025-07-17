import { PromptTemplate } from "@langchain/core/prompts";
import { ClarifaiConfigurable, ClarifaiState } from "../graph";
import { initChatModel } from "langchain/chat_models/universal";
import { UpdateEvent } from "@/lib/graph/event-types";
import { ExtractClaimListSchema } from "../schemas";
import { RunnableConfig } from "@langchain/core/runnables";

const promptTemplate = PromptTemplate.fromTemplate(`
Tu es un assistant chargé d'extraire les affirmations factuelles explicites contenues dans un texte.

Une affirmation factuelle :
- est une déclaration pouvant être vérifiée comme vraie ou fausse,
- est formulée de manière affirmative,
- n’est pas une simple opinion, une question ou un commentaire flou.

Tu vas recevoir une liste de segments. 
Pour chacun, décide s’il contient une ou plusieurs affirmations.
Ne produit pas d'overlap entre les affirmations, chaque affirmation doit être clairement découpé.

Renvoie uniquement la liste des affirmations factuelles détectées, sous forme de tableau JSON.
Si le segment contient une ou plusieurs affirmations, extrait les  et renvoie un tableau JSON contenant pour chaque segment les affirmations détectés, avec les champs suivants :
- l'identifiant du segment
- le contenu du segment contenant l'affirmation, sois le plus précis possible dans le contenu ciblé, n'inclut pas le segment entier si l'affirmation est dans une partie spécifique
- une justification brève et claire

Segments:
{segments}
`);

export async function extractClaims(
  state: ClarifaiState,
  config: RunnableConfig<ClarifaiConfigurable>
): Promise<Partial<ClarifaiState>> {
  console.debug("Extracting claims in content...");

  const model = await initChatModel(config.configurable!.extractClaimsModel, {
    modelProvider: "openai",
    temperature: 0,
  });
  const structuredModel = model.withStructuredOutput(ExtractClaimListSchema);
  const chain = promptTemplate.pipe(structuredModel);

  const response = await chain.invoke({
    segments: state.segments
      .map((segment) => `id: ${segment.id} - ${segment.content}`)
      .join("\n"),
  });

  const extractedClaims =
    ExtractClaimListSchema.safeParse(response).data?.claims || [];
  const event: UpdateEvent = {
    step: "extractClaims",
    type: "update",
    payload: {
      claims: extractedClaims,
    },
  };
  console.debug(
    "Claims extracted:",
    extractedClaims?.length || "Claims undefined !!!"
  );
  return { extractedClaims, events: [event] };
}
