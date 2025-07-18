"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormContext } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAgbStore } from "../use-agb-store";
import { AgentSelectorDialog } from "./agb-profiles-select";
import { useState } from "react";
import { AGENTS_PROFILES } from "../agents";
import { Plus } from "lucide-react";
type AgbConfiguratorProps = {
  className?: string;
};

const formSchema = z.object({
  topic: z.string().min(2, "Topic is required"),
  agentIds: z
    .array(z.string())
    .min(2, "At least two agents are required")
    .max(5, "Maximum of five agents allowed"),
});

export function AgbConfigurator({ className }: AgbConfiguratorProps) {
  const { startDebate, running } = useAgbStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      agentIds: [] as string[],
    },
  });

  const selectedAgents = form.watch("agentIds");

  const [dialogOpen, setDialogOpen] = useState(false);
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Config ready:", values);
    const agents = AGENTS_PROFILES.filter((p) =>
      values.agentIds.includes(p.id)
    );
    startDebate({
      topic: values.topic,
      agents,
    });
  }
  return (
    <>
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 w-[400px]"
            >
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Topic of your choice"
                        disabled={running}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => setDialogOpen(true)}
              >
                <Plus /> Add agents
              </Button>
              {selectedAgents.length > 0 ? (
                <div className="">
                  <p className="text-sm text-muted-foreground">
                    Selected agents:
                  </p>
                  <ul className="list-disc pl-5 mt-2">
                    {selectedAgents.map((id) => {
                      const profile = AGENTS_PROFILES.find((p) => p.id === id);
                      return (
                        <li key={id} className="text-sm">
                          {profile?.name || "Unknown Agent"}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p>No agents selected yet</p>
              )}
              <Button type="submit" className="w-full" disabled={running}>
                Launch conversation
              </Button>
              <AgentSelectorDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={(selected) => {
                  form.setValue(
                    "agentIds",
                    selected.map((p) => p.id)
                  );
                  setDialogOpen(false);
                }}
                initialSelection={
                  selectedAgents
                    .map((id) => AGENTS_PROFILES.find((p) => p.id === id))
                    .filter((p) => p !== undefined)
                    .filter(Boolean) || []
                }
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
