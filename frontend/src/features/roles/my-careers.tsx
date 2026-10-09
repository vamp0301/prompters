"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { Dialog, ErrorState, Skeleton } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { CareerRoleSummary, ExperienceLevel, TargetRoleProfile } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { InlineError } from "@/features/career/shared";
import { LEVELS, RolePicker, roleKeys } from "./role-picker";

const LEVEL_LABEL = Object.fromEntries(LEVELS.map((l) => [l.value, l.label])) as Record<ExperienceLevel, string>;

/** The careers a student is preparing for. Each has its own plan, interviews and recommendations. */
export function MyCareers() {
  const qc = useQueryClient();
  const mine = useQuery({ queryKey: roleKeys.mine, queryFn: () => api.get<TargetRoleProfile[]>("/me/target-roles") });
  const [adding, setAdding] = useState(false);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: roleKeys.mine });
    // Recommendations follow the primary career.
    void qc.invalidateQueries({ queryKey: ["personalization"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const primary = useMutation({ mutationFn: (id: string) => api.post(`/me/target-roles/${id}/primary`), onSuccess: refresh });
  const archive = useMutation({ mutationFn: (id: string) => api.delete(`/me/target-roles/${id}`), onSuccess: refresh });
  const level = useMutation({ mutationFn: ({ id, value }: { id: string; value: ExperienceLevel }) => api.patch(`/me/target-roles/${id}`, { level: value }), onSuccess: refresh });

  return (
    <Card id="careers" className="scroll-mt-20">
      <CardHeader
        title="Careers you're preparing for"
        description="Each career has its own learning path, Top-100 questions, interviews and recommendations. Skills you prove count for every career that needs them."
        action={
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)} disabled={(mine.data?.length ?? 0) >= 5}>
            <Plus className="size-4" aria-hidden /> Add a career
          </Button>
        }
      />
      <CardBody>
        {mine.isLoading ? (
          <Skeleton className="h-20" />
        ) : mine.error ? (
          <ErrorState error={mine.error} retry={() => mine.refetch()} />
        ) : !mine.data?.length ? (
          <p className="text-sm text-muted">No career chosen yet. Add the role you&apos;re preparing for.</p>
        ) : (
          <ul className="space-y-2">
            {mine.data.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.role?.name ?? p.roleKey}</span>
                    {p.primary && <Badge tone="accent">Primary</Badge>}
                    {p.role && !p.role.reviewed && <Badge>Framework not yet practitioner-reviewed</Badge>}
                  </div>
                  <div className="text-xs text-muted">
                    {p.role?.familyName}
                    {p.timeline ? ` · target ${formatDate(p.timeline)}` : ""}
                    {p.job ? ` · job: ${p.job.title}` : ""}
                  </div>
                </div>
                <label className="sr-only" htmlFor={`lvl-${p.id}`}>
                  Experience level for {p.role?.name}
                </label>
                <Select id={`lvl-${p.id}`} value={p.level} onChange={(e) => level.mutate({ id: p.id, value: e.target.value as ExperienceLevel })} className="h-8 w-auto text-xs">
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {LEVEL_LABEL[l.value]}
                    </option>
                  ))}
                </Select>
                {!p.primary && (
                  <Button size="sm" variant="ghost" onClick={() => primary.mutate(p.id)} loading={primary.isPending && primary.variables === p.id}>
                    <Star className="size-3.5" aria-hidden /> Make primary
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => archive.mutate(p.id)} loading={archive.isPending && archive.variables === p.id} aria-label={`Archive ${p.role?.name ?? p.roleKey}`}>
                  <Archive className="size-3.5" aria-hidden /> <span className="sr-only sm:not-sr-only">Archive</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
        <InlineError error={primary.error ?? archive.error ?? level.error} />
      </CardBody>
      <AddCareer open={adding} onClose={() => setAdding(false)} exclude={(mine.data ?? []).map((p) => p.roleKey)} onAdded={refresh} />
    </Card>
  );
}

function AddCareer({ open, onClose, exclude, onAdded }: { open: boolean; onClose: () => void; exclude: string[]; onAdded: () => void }) {
  const [role, setRole] = useState<CareerRoleSummary | null>(null);
  const [lvl, setLvl] = useState<ExperienceLevel>("STUDENT");
  const [makePrimary, setMakePrimary] = useState(false);
  const add = useMutation({
    meta: { silent: true },
    mutationFn: () => api.post("/me/target-roles", { roleKey: role!.key, level: lvl, primary: makePrimary }),
    onSuccess: () => {
      onAdded();
      setRole(null);
      onClose();
    },
  });
  return (
    <Dialog open={open} onClose={onClose} title="Add a career" className="max-w-2xl">
      <div className="space-y-4">
        <RolePicker value={role?.key ?? null} onChange={setRole} exclude={exclude} />
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Experience" htmlFor="add-career-level">
            <Select id="add-career-level" value={lvl} onChange={(e) => setLvl(e.target.value as ExperienceLevel)}>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" checked={makePrimary} onChange={(e) => setMakePrimary(e.target.checked)} /> Make it my primary career
          </label>
          <Button className="ml-auto" onClick={() => add.mutate()} disabled={!role} loading={add.isPending}>
            Add {role ? role.name : "career"}
          </Button>
        </div>
        <InlineError error={add.error} />
      </div>
    </Dialog>
  );
}
