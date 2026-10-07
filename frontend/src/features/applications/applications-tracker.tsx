"use client";
import Link from "next/link";
import { useCallback, useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Dialog, EmptyState, ErrorState, PageHeader, PageSkeleton, Stat } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import type { ApplicationStatus, JobApplication } from "@/lib/api/types";
import { cn, formatDate, relativeTime } from "@/lib/utils";

const STATUSES: { value: ApplicationStatus; label: string; tone: "neutral" | "accent" | "danger" | "warn" | "info" }[] = [
  { value: "APPLIED", label: "Applied", tone: "neutral" },
  { value: "ASSESSMENT", label: "Assessment", tone: "info" },
  { value: "TECHNICAL", label: "Technical", tone: "info" },
  { value: "HR", label: "HR", tone: "info" },
  { value: "OFFER", label: "Offer", tone: "accent" },
  { value: "REJECTED", label: "Rejected", tone: "danger" },
  { value: "WITHDRAWN", label: "Withdrawn", tone: "neutral" },
];
const LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label])) as Record<ApplicationStatus, string>;
const CLOSED: ApplicationStatus[] = ["OFFER", "REJECTED", "WITHDRAWN"];

const isFuture = (iso: string | null) => !!iso && new Date(iso).getTime() > Date.now();

const pad = (n: number) => String(n).padStart(2, "0");
/** ISO → value for <input type="date"> in local time. */
const toDateInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
/** ISO → value for <input type="datetime-local">. */
const toDateTimeInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${toDateInput(iso)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
/** Input value (date or datetime-local, interpreted in local time) → ISO, or null when empty. */
const fromInput = (v: string) => {
  if (!v) return null;
  const d = new Date(v.includes("T") ? v : `${v}T00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

type Payload = Omit<JobApplication, "id" | "createdAt" | "updatedAt">;

export function ApplicationsTracker() {
  const qc = useQueryClient();
  const { data, error, isLoading, refetch } = useQuery({ queryKey: ["applications"], queryFn: () => api.get<JobApplication[]>("/applications") });
  const [editing, setEditing] = useState<JobApplication | "new" | null>(null);
  const [deleting, setDeleting] = useState<JobApplication | null>(null);
  const closeEdit = useCallback(() => setEditing(null), []);
  const closeDelete = useCallback(() => setDeleting(null), []);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["applications"] });
    qc.invalidateQueries({ queryKey: ["journey"] });
  };

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/applications/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success("Application deleted");
    },
  });

  const apps = useMemo(() => data ?? [], [data]);
  const grouped = useMemo(() => STATUSES.map((s) => ({ ...s, items: apps.filter((a) => a.status === s.value) })), [apps]);

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;

  const active = apps.filter((a) => !CLOSED.includes(a.status)).length;
  const upcoming = apps.filter((a) => isFuture(a.interviewAt)).length;
  const offers = apps.filter((a) => a.status === "OFFER").length;

  const addButton = (
    <Button onClick={() => setEditing("new")}>
      <Plus className="size-4" aria-hidden /> Add application
    </Button>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Job search"
        title="Applications"
        description={<>Track every application from first click to offer. Adding an application and receiving an offer both show up on your <Link href="/journey" className="text-text underline underline-offset-4">Journey</Link>.</>}
        actions={apps.length > 0 ? addButton : undefined}
      />

      {apps.length === 0 ? (
        <EmptyState
          icon={<BriefcaseBusiness className="size-5" />}
          title="Start tracking your job search."
          description="Log each application, its current round and upcoming interviews in one place, so nothing slips through the cracks."
          action={addButton}
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Total" value={apps.length} />
            <Stat label="Active" value={active} hint="Still in progress" />
            <Stat label="Interviews upcoming" value={upcoming} />
            <Stat label="Offers" value={offers} />
          </div>

          <div className="space-y-6 lg:flex lg:gap-4 lg:space-y-0 lg:overflow-x-auto lg:pb-3" aria-label="Applications by status">
            {grouped.map((col) => (
              <section key={col.value} aria-labelledby={`col-${col.value}`} className={cn("lg:w-72 lg:shrink-0", col.items.length === 0 && "hidden lg:block")}>
                <h2 id={`col-${col.value}`} className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  <span>{col.label}</span>
                  <span className="font-mono text-subtle">{col.items.length}</span>
                </h2>
                {col.items.length ? (
                  <ul className="space-y-2 lg:rounded-xl lg:bg-surface-2/40 lg:p-2">
                    {col.items.map((a) => (
                      <ApplicationCard key={a.id} app={a} onEdit={() => setEditing(a)} onDelete={() => setDeleting(a)} onChanged={invalidate} />
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-subtle">Nothing here</div>
                )}
              </section>
            ))}
          </div>
        </>
      )}

      <Dialog open={editing !== null} onClose={closeEdit} title={editing === "new" ? "Add application" : "Edit application"}>
        {editing !== null && (
          <ApplicationForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? null : editing}
            onCancel={closeEdit}
            onSaved={() => {
              invalidate();
              setEditing(null);
            }}
          />
        )}
      </Dialog>

      <Dialog open={deleting !== null} onClose={closeDelete} title="Delete application?">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Delete <span className="font-medium text-text">{deleting.role}</span> at <span className="font-medium text-text">{deleting.company}</span>? This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeDelete}>Cancel</Button>
              <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(deleting.id)}>Delete</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function ApplicationCard({ app: a, onEdit, onDelete, onChanged }: { app: JobApplication; onEdit: () => void; onDelete: () => void; onChanged: () => void }) {
  const uid = useId();
  const status = useMutation({
    mutationFn: (s: ApplicationStatus) => api.patch<JobApplication>(`/applications/${a.id}`, { status: s }),
    onSuccess: (updated) => {
      onChanged();
      toast.success(updated.status === "OFFER" ? `Offer from ${updated.company} — congratulations! It's on your Journey.` : `Moved to ${LABEL[updated.status]}`);
    },
  });
  const tone = STATUSES.find((s) => s.value === a.status)?.tone ?? "neutral";

  return (
    <li className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium">{a.company}</div>
          <div className="truncate text-sm text-muted">{a.role}</div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button type="button" onClick={onEdit} aria-label={`Edit ${a.role} at ${a.company}`} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-accent">
            <Pencil className="size-3.5" aria-hidden />
          </button>
          <button type="button" onClick={onDelete} aria-label={`Delete ${a.role} at ${a.company}`} className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-accent">
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone={tone} className="lg:hidden">{LABEL[a.status]}</Badge>
        {a.round && <Badge>{a.round}</Badge>}
        {a.result && <Badge tone={a.status === "OFFER" ? "accent" : "neutral"}>{a.result}</Badge>}
      </div>

      <dl className="mt-2 space-y-1 text-xs">
        {a.interviewAt && (
          <div className="flex items-center gap-1.5">
            <CalendarClock className={cn("size-3.5", isFuture(a.interviewAt) ? "text-accent" : "text-subtle")} aria-hidden />
            <dt className="text-muted">Interview</dt>
            <dd className={cn("font-mono", isFuture(a.interviewAt) ? "text-text" : "text-subtle")} title={new Date(a.interviewAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}>{relativeTime(a.interviewAt)}</dd>
          </div>
        )}
        {a.nextStepAt && (
          <div className="flex items-center gap-1.5">
            <dt className="text-muted">Next step</dt>
            <dd className="font-mono" title={formatDate(a.nextStepAt)}>{relativeTime(a.nextStepAt)}</dd>
          </div>
        )}
        {a.appliedAt && (
          <div className="flex items-center gap-1.5">
            <dt className="text-muted">Applied</dt>
            <dd className="font-mono text-subtle">{formatDate(a.appliedAt)}</dd>
          </div>
        )}
      </dl>

      {a.notes && <p className="mt-2 line-clamp-2 text-xs text-subtle">{a.notes}</p>}

      <div className="mt-3">
        <label htmlFor={`${uid}-status`} className="sr-only">Status for {a.role} at {a.company}</label>
        <Select id={`${uid}-status`} value={a.status} disabled={status.isPending} onChange={(e) => status.mutate(e.target.value as ApplicationStatus)} className="h-8 text-xs">
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>
    </li>
  );
}

function ApplicationForm({ initial, onCancel, onSaved }: { initial: JobApplication | null; onCancel: () => void; onSaved: () => void }) {
  const uid = useId();
  const [form, setForm] = useState(() => ({
    company: initial?.company ?? "",
    role: initial?.role ?? "",
    status: initial?.status ?? ("APPLIED" as ApplicationStatus),
    round: initial?.round ?? "",
    appliedAt: initial ? toDateInput(initial.appliedAt) : toDateInput(new Date().toISOString()),
    nextStepAt: toDateInput(initial?.nextStepAt ?? null),
    interviewAt: toDateTimeInput(initial?.interviewAt ?? null),
    result: initial?.result ?? "",
    notes: initial?.notes ?? "",
  }));
  const [errors, setErrors] = useState<Partial<Record<"company" | "role", string>>>({});
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: (body: Payload) => (initial ? api.patch<JobApplication>(`/applications/${initial.id}`, body) : api.post<JobApplication>("/applications", body)),
    onSuccess: (saved) => {
      if (!initial) toast.success("Application added — it's on your Journey.");
      else if (saved.status === "OFFER" && initial.status !== "OFFER") toast.success(`Offer from ${saved.company} — congratulations! It's on your Journey.`);
      else toast.success("Application updated");
      onSaved();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const company = form.company.trim();
    const role = form.role.trim();
    const errs: typeof errors = {};
    if (!company) errs.company = "Company is required.";
    if (!role) errs.role = "Role is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    save.mutate({
      company,
      role,
      status: form.status,
      round: form.round.trim() || null,
      appliedAt: fromInput(form.appliedAt),
      nextStepAt: fromInput(form.nextStepAt),
      interviewAt: fromInput(form.interviewAt),
      result: form.result.trim() || null,
      notes: form.notes.trim() || null,
    });
  };

  const id = (k: string) => `${uid}-${k}`;
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" htmlFor={id("company")} error={errors.company}>
          <Input id={id("company")} value={form.company} onChange={(e) => set("company", e.target.value)} maxLength={100} required aria-invalid={!!errors.company} autoFocus />
        </Field>
        <Field label="Role" htmlFor={id("role")} error={errors.role}>
          <Input id={id("role")} value={form.role} onChange={(e) => set("role", e.target.value)} maxLength={100} required aria-invalid={!!errors.role} placeholder="e.g. SDE Intern" />
        </Field>
        <Field label="Status" htmlFor={id("status")}>
          <Select id={id("status")} value={form.status} onChange={(e) => set("status", e.target.value as ApplicationStatus)}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </Field>
        <Field label="Current round" htmlFor={id("round")}>
          <Input id={id("round")} value={form.round} onChange={(e) => set("round", e.target.value)} maxLength={100} placeholder="e.g. Online assessment" />
        </Field>
        <Field label="Applied on" htmlFor={id("appliedAt")}>
          <Input id={id("appliedAt")} type="date" value={form.appliedAt} onChange={(e) => set("appliedAt", e.target.value)} />
        </Field>
        <Field label="Next step by" htmlFor={id("nextStepAt")}>
          <Input id={id("nextStepAt")} type="date" value={form.nextStepAt} onChange={(e) => set("nextStepAt", e.target.value)} />
        </Field>
        <Field label="Interview at" htmlFor={id("interviewAt")} className="sm:col-span-2">
          <Input id={id("interviewAt")} type="datetime-local" value={form.interviewAt} onChange={(e) => set("interviewAt", e.target.value)} />
        </Field>
        <Field label="Result" htmlFor={id("result")} className="sm:col-span-2" hint="e.g. Offer ₹8 LPA, or feedback you received">
          <Input id={id("result")} value={form.result} onChange={(e) => set("result", e.target.value)} maxLength={200} />
        </Field>
        <Field label="Notes" htmlFor={id("notes")} className="sm:col-span-2">
          <Textarea id={id("notes")} value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={4000} placeholder="Referral, recruiter name, topics they asked…" />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={save.isPending}>{initial ? "Save changes" : "Add application"}</Button>
      </div>
    </form>
  );
}
