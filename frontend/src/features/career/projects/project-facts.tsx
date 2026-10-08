"use client";
import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import type { ProjectModule } from "@/lib/api/types";
import { InlineError } from "../shared";
import { projectKeys } from "./projects-list";
import { BasisBadge } from "./project-ui";

/** The editable Project Facts panel. Editing never changes the resume; empty = unknown (or back to the resume's value). */
export function ProjectFacts({ project }: { project: ProjectModule }) {
  const uid = useId();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const save = useMutation({
    meta: { silent: true },
    mutationFn: () => api.patch<ProjectModule>(`/career/projects/${project.id}/facts`, { facts: draft }),
    onSuccess: (p) => {
      qc.setQueryData(projectKeys.one(project.id), p);
      qc.invalidateQueries({ queryKey: projectKeys.list, exact: true }); // not the open module: refetching it would rebuild it unasked
      setDraft({});
    },
  });
  const groups = [...new Set(project.facts.map((f) => f.group))];
  const changed = Object.keys(draft).length;
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (changed) save.mutate();
      }}
    >
      <p className="text-sm text-muted">
        Correct or add what only you know — your contribution, scale, the real reasons behind choices, measured results. Your edits win over the resume; the resume itself is never changed. After saving, the module rebuilds with your facts.
      </p>
      {groups.map((g) => (
        <fieldset key={g} className="space-y-3">
          <legend className="eyebrow mb-1 text-accent">{g}</legend>
          <div className="grid gap-3 md:grid-cols-2">
            {project.facts
              .filter((f) => f.group === g)
              .map((f) => (
                <Field
                  key={f.key}
                  htmlFor={`${uid}-${f.key}`}
                  label={
                    <span className="flex items-center gap-2">
                      {f.label} {f.source === "RESUME" ? <BasisBadge basis="RESUME" /> : f.source === "USER" ? <BasisBadge basis="USER_FACT" /> : <BasisBadge basis="NOT_SPECIFIED" />}
                    </span>
                  }
                  hint={f.hint}
                >
                  <Input
                    id={`${uid}-${f.key}`}
                    value={draft[f.key] ?? f.value ?? ""}
                    placeholder="Not specified — edit this answer"
                    maxLength={500}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  />
                </Field>
              ))}
          </div>
        </fieldset>
      ))}
      <InlineError error={save.error} />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!changed} loading={save.isPending}>
          <Save className="size-4" aria-hidden /> Save {changed ? `${changed} change${changed === 1 ? "" : "s"}` : "facts"}
        </Button>
        {save.isSuccess && !changed && <span role="status" className="text-sm text-accent">Saved. The module will rebuild with your facts.</span>}
      </div>
    </form>
  );
}
