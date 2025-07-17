import { Fragment, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Annotation,
  AnnotationBiasData,
  AnnotationClaimData,
} from "../use-clarifai-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExtractedBias, ExtractedVerifiedClaim } from "../ai/schemas";

function ClaimCard({ data }: { data: AnnotationClaimData }): ReactNode {
  return (
    <Card className="w-full text-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span className="underline">Claim</span> <Badge>{data.verdict}</Badge>
        </CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="border-l-8 border-red pl-2 italic">{data.content}</div>
        <div>{data.explanation}</div>
        <div>
          <span>Sources:</span>
          {data.sources.map((source: string, index: number) => (
            <div key={source} className="text-sm text-muted-foreground">
              <a href={source} target="_blank" rel="noopener noreferrer">
                {source}
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BiasCard({ data }: { data: AnnotationBiasData }): ReactNode {
  return (
    <Card className="w-full text-sm">
      <CardHeader>
        <CardTitle className="underline">Bias {data.biasType}</CardTitle>
        <CardDescription className="flex gap-2 items-start">
          <HelpCircle size={48} />
          {data.typeExplanation}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="border-l-8 border-red pl-2 italic">{data.content}</div>
        <div> {data.explanation}</div>
      </CardContent>
    </Card>
  );
}
export function applyAnnotations(
  content: string,
  annotations: Annotation[]
): ReactNode[] {
  //console.log("Applying annotations to content:", content, annotations);

  if (!Array.isArray(annotations) || annotations.length === 0) {
    return [content];
  }

  const parts: ReactNode[] = [];

  // Step 1 : Extract unique split points using a Set to avoid duplicates
  const splitPoints = new Set<number>();
  splitPoints.add(0); // Always include start of content
  splitPoints.add(content.length); // Always include end of content
  for (const ann of annotations) {
    splitPoints.add(ann.start);
    splitPoints.add(ann.end);
  }

  const sortedPoints = Array.from(splitPoints).sort((a, b) => a - b);

  let chunkIndex = 0;
  // Step2 : Iterate over fragments based on these points
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];
    const text = content.slice(start, end);
    if (!text) continue;

    // Step 3 : Get annotations for this fragment
    const framentAnnotations = annotations.filter(
      (ann) => ann.start < end && ann.end > start
    );

    // If no annotations, just add the text as a fragment
    if (framentAnnotations.length === 0) {
      parts.push(
        <Fragment key={`${chunkIndex}`}>
          <span>{text}</span>
        </Fragment>
      );
      continue;
    }

    // Step 4 : Apply styles based on annotations
    const isBias = framentAnnotations.some((a) => a.type === "bias");
    const isClaimTrue = framentAnnotations.some(
      (a) => a.type === "claim" && a.data.verdict === "true"
    );
    const isClaimFalse = framentAnnotations.some(
      (a) => a.type === "claim" && a.data.verdict === "false"
    );
    const isClaimPartiallyTrue = framentAnnotations.some(
      (a) => a.type === "claim" && a.data.verdict === "partially_true"
    );
    const isClaimUnverifiable = framentAnnotations.some(
      (a) => a.type === "claim" && a.data.verdict === "unverifiable"
    );

    const popOverParts: ReactNode[] = [];

    framentAnnotations.forEach((a, i) => {
      if (a.type === "bias") {
        popOverParts.push(<BiasCard data={a.data} key={"bias" + i} />);
      }
      if (a.type === "claim") {
        popOverParts.push(<ClaimCard data={a.data} key={"claim" + i} />);
      }
    });

    parts.push(
      <Popover key={`chunkIndex-${chunkIndex}`} modal>
        <PopoverTrigger asChild>
          <span
            data-chunk-index={chunkIndex}
            data-start={start}
            data-end={end}
            data-is-bias={isBias ? "true" : "false"}
            data-is-claim={
              isClaimTrue ||
              isClaimFalse ||
              isClaimPartiallyTrue ||
              isClaimUnverifiable
                ? "true"
                : "false"
            }
            className={cn(
              "px-0.5 rounded",
              isBias &&
                "underline decoration-dotted underline-offset-4 hover:decoration-solid cursor-pointer",
              isClaimTrue &&
                "text-green-500 hover:decoration-solid cursor-pointer",
              isClaimFalse &&
                "text-red-500 hover:decoration-solid cursor-pointer",
              isClaimPartiallyTrue &&
                "text-yellow-500 hover:decoration-solid cursor-pointer",
              isClaimUnverifiable &&
                "text-gray-500 hover:decoration-solid cursor-pointer"
            )}
          >
            {text}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] space-y-2">
          {popOverParts}
        </PopoverContent>
      </Popover>
    );
    chunkIndex++;
  }

  return parts;
}
