import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CircleCheckBigIcon, Ellipsis, LoaderCircle } from "lucide-react";
import Markdown from "react-markdown";
import { useClarifaiStore } from "../use-clarifai-store";
import { applyAnnotations } from "../lib/apply-annotations";
import { Badge } from "@/components/ui/badge";

interface BasicProps {
  className?: string;
}

const stepsLabels: Record<string, string> = {
  preprocessing: "Pre processing",
  detecting_biases: "Detecting biases",
  extracting_claims: "Extracting claims",
  verifying_claims: "Verifying claims",
  generating_report: "Generating report",
};

type ProcessLogProps = {
  className?: string;
};

function ProcessLog({ className }: ProcessLogProps) {
  const { graphLog: processLog } = useClarifaiStore();

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>VerifAI Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(processLog).map(([step, status]) => (
          <div
            key={step}
            className="flex items-center gap-2 text-muted-foreground"
          >
            {status === "done" && <CircleCheckBigIcon />}
            {status === "todo" && <Ellipsis />}
            {status === "in-progress" && (
              <LoaderCircle className="animate-spin" />
            )}

            <span>{stepsLabels[step]}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SegmentedTextView({ className }: BasicProps) {
  const { chunks, extractedClaimsLength } = useClarifaiStore();

  return (
    <Card className={cn("max-h-fit", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <Badge variant="default">Claims: {extractedClaimsLength}</Badge>
          <Badge variant="default">Biaises: {0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full">
        <div className={cn("space-y-6")}>
          {chunks.map((chunk) => (
            <p
              key={chunk.id}
              className="leading-relaxed w-full"
              data-chunk-id={chunk.id}
            >
              {applyAnnotations(chunk.content, chunk.annotations)}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FinalReport({ className }: BasicProps) {
  const { report } = useClarifaiStore();
  return (
    <Card className={cn("max-h-fit", className)}>
      <CardContent>
        {" "}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {report ? <Markdown>{report}</Markdown> : "No report generated yet."}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClarifaiPanel({ className }: BasicProps) {
  const { reset } = useClarifaiStore();

  return (
    <div className={cn(className, "flex space-x-4 w-full items-start pt-8")}>
      <Button
        variant="secondary"
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        onClick={() => reset()}
      >
        Nouvelle analyse
      </Button>

      <ProcessLog className="min-w-60 max-h-fit" />
      <div className="flex-1 flex space-y-4 gap-4">
        <SegmentedTextView className="w-1/2" />
        <FinalReport className="w-1/2" />
      </div>
    </div>
  );
}
