"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgentProfile, AGENTS_PROFILES } from "../agents";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AgentSelectorDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (selected: AgentProfile[]) => void;
  initialSelection?: AgentProfile[];
};

export function AgentSelectorDialog({
  open,
  onClose,
  onSave,
  initialSelection = [],
}: AgentSelectorDialogProps) {
  const [selected, setSelected] = useState<AgentProfile[]>(initialSelection);

  /**
   * Reset the selected profiles when the dialog opens.
   */
  useEffect(() => {
    if (open) setSelected(initialSelection);
  }, [open, initialSelection]);

  function toggle(profile: AgentProfile) {
    setSelected((prev) => {
      const exists = prev.find((p) => p.id === profile.id);
      if (exists) return prev.filter((p) => p.id !== profile.id);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, profile];
    });
  }
  function isSelected(id: string) {
    return selected.some((p) => p.id === id);
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            Select agents to add - {selected.length} selected
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto py-4">
          {AGENTS_PROFILES.map((profile) => (
            <Card
              key={profile.id}
              onClick={() => toggle(profile)}
              className={`cursor-pointer border rounded-xl p-4 shadow-sm transition ${
                isSelected(profile.id)
                  ? "border-primary bg-primary/10"
                  : "hover:bg-muted"
              }`}
            >
              <CardHeader>
                <CardTitle>{profile.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="border-l-6 pl-4 text-xs">{profile.catchphrase}</p>
                <p className="">{profile.personality}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(selected);
              onClose();
            }}
            disabled={selected.length < 2 || selected.length > 5}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
