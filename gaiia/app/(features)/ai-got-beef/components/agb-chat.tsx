"use client";

import { cn } from "@/lib/utils";
import { useAgbStore } from "../use-agb-store";

type AgbChatProps = {
  className?: string;
};

export function AgbChat({ className }: AgbChatProps) {
  const { turns } = useAgbStore();

  return (
    <div
      className={cn("flex h-full w-full items-start justify-center", className)}
    >
      <div className="mt-4 flex w-full flex-col space-y-4">
        {turns.map((turn, index) => (
          <div key={index} className="my-2 w-full ">
            <div className="flex  items-center space-x-2">
              <span className="font-semibold">{turn.name}:</span>
              <span className="">{turn.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
