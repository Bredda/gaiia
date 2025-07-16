import { PromptTemplate } from "@langchain/core/prompts";
import {
  ClarifaiConfigurable,
  ClarifaiState,
  ExtractedBiasesSchema,
} from "../schema";
import { RunnableConfig } from "@langchain/core/runnables";
import { GraphEvent } from "@shared-types/graph-events";
import { buildLlmModel } from "@utils/build-model";

const promptTemplate = PromptTemplate.fromTemplate(`

Tu es un assistant chargé d’évaluer un texte et de détecter la présence de biais rédactionnels ou rhétoriques.

Un biais peut se manifester par :
- un langage émotionnel ou exagéré,
- une prise de position implicite ou explicite,
- une absence d’équilibre dans la présentation des faits,
- une généralisation abusive,
- une formulation tendancieuse ou ambigüe.

Pour chaque segment fourni, analyse son contenu et détermine s’il contient un ou plusieurs biais rédactionnels ou rhétoriques. 
Ne produit pas d'overlap entre les biais, chaque biais doit être clairement découpé.
Si le segment contient un biais, extrait les  et renvoie un tableau JSON contenant pour chaque segment les biais détectés, avec les champs suivants :
- l'identifiant du segment
- le contenu du segment contenant le biais, sois le plus précis possible dans le contenu ciblé, n'inclut pas le segment entier si le biais est dans une partie spécifique
- le type de biais (émotionnel, idéologique, exagération, omission, autre… - liste non exhaustive)
- une justification brève et claire
- une explication pédagogique du principe du type de biais détecté

                                      
Si le segment contient plusieurs biais, liste-les tous avec leurs justifications respectives.
Si le segment ne contient pas de biais, ignore-le.

Segments:
{segments}
`);
export async function detectBiases(
  state: ClarifaiState,
  config: RunnableConfig<ClarifaiConfigurable>
): Promise<Partial<ClarifaiState>> {
  const structuredModel = await buildLlmModel(
    config.configurable!.biasDetectionModel,
    { structuredOutput: ExtractedBiasesSchema }
  );
  const chain = promptTemplate.pipe(structuredModel);

  const response = await chain.invoke({
    segments: state.segments
      .map((segment) => `id: ${segment.id} - ${segment.content}`)
      .join("\n"),
  });
  const extractedBiases =
    ExtractedBiasesSchema.safeParse(response).data?.biases || [];
  const event: GraphEvent = {
    stepId: "detectBiases",
    label: "Biases detected",
    payload: { biases: extractedBiases },
  };
  console.debug(
    "Biases detected:",
    extractedBiases?.length || "Biases undefined !!!"
  );
  return { extractedBiases, events: [event] };
}
