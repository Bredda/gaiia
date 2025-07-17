"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Markdown from "react-markdown";

interface FeatureHomeMarkdownProps {
  className?: string;

  slug: string;
}

export function FeatureHomeMarkdown({
  className,
  slug,
}: FeatureHomeMarkdownProps) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    fetch(`/feature-markdown/${slug}/README.md`)
      .then((res) => res.text())
      .then(setContent)
      .catch((err) => {
        console.error("Erreur de chargement du markdown :", err);
        setContent("# Erreur\nImpossible de charger la documentation.");
      });
  }, []);
  return (
    <div
      className={cn(
        "prose dark:prose-invert max-w-full w-2/3 mx-auto px-4 py-8",
        className
      )}
    >
      <Markdown>{content}</Markdown>
    </div>
  );
}
