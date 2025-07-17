"use client";

import { ChatInvite } from "@/components/chat/chat-invite";
import { AnimatePresence, motion } from "motion/react";
import { ClarifaiPanel } from "../components/clarifai-panelt";
import { useClarifaiStore } from "../use-clarifai-store";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ClarifaiHome() {
  const { clarify, hasSubmitted } = useClarifaiStore();
  const [example, setExample] = useState<string | null>(null);

  function handleGenerateExample() {
    setExample(
      "Contrairement à ce que prétendent les scientifiques alarmistes, le réchauffement climatique n’est pas une urgence. Les températures ont toujours fluctué au cours de l’histoire, et il est arrogant de croire que l’homme peut changer le climat. De toute façon, les technologies vertes coûtent cher et détruisent des emplois. Les médias, financés par les élites, exagèrent volontairement la menace pour manipuler l’opinion."
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <AnimatePresence mode="wait">
        {!hasSubmitted ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-2 w-full"
          >
            <div className="text-4xl font-bold">Clarif.ai</div>
            <div className="text-muted-foreground -4pt">
              Empowering your critical thinking with AI
            </div>
            <ChatInvite
              description="Copy-past text or source URL to analyze"
              forcedValue={example}
              onSubmit={(content) => clarify({ content })}
              className="w-full"
            />
            <Button variant="outline" size="sm" onClick={handleGenerateExample}>
              Generate exemple
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="output"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <ClarifaiPanel className="w-2/3" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
