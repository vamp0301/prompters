"use client";
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/misc";
import { useMe } from "@/features/auth/use-me";
import { api } from "@/lib/api/client";

function passwordProblem(pw: string) {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(pw)) return "Include at least one letter.";
  if (!/[0-9]/.test(pw)) return "Include at least one number.";
  return null;
}

export function PasswordCard() {
  const { data: me } = useMe();
  const hasPassword = me?.hasPassword !== false;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ next?: string; confirm?: string }>({});
  const change = useMutation({
    mutationFn: () => api.post("/auth/change-password", { currentPassword: current, newPassword: next }),
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password changed. Other devices have been signed out.");
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = { next: passwordProblem(next) ?? undefined, confirm: next !== confirm ? "Passwords don't match." : undefined };
    setErrors(errs);
    if (errs.next || errs.confirm) return;
    change.mutate();
  };

  return (
    <Card>
      <CardHeader title="Change password" description="Changing it signs you out on every other device." />
      <CardBody>
        <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-3">
          {hasPassword ? (
          <Field label="Current password" htmlFor="pw-current">
            <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} maxLength={128} />
          </Field>
          ) : (
            <p className="text-xs text-muted sm:col-span-3">You signed up with Google. Set a password to also log in with email.</p>
          )}
          <Field label="New password" htmlFor="pw-new" error={errors.next} hint="8+ characters with a letter and a number.">
            <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} maxLength={128} aria-invalid={!!errors.next} required />
          </Field>
          <Field label="Confirm new password" htmlFor="pw-confirm" error={errors.confirm}>
            <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={128} aria-invalid={!!errors.confirm} required />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" loading={change.isPending} disabled={!next || !confirm}>Update password</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function SessionsCard() {
  const qc = useQueryClient();
  const logoutAll = useMutation({
    mutationFn: () => api.post("/auth/logout-all"),
    onSuccess: () => {
      qc.clear();
      // Full reload on purpose: drops all cached private data.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    },
  });
  return (
    <Card>
      <CardHeader title="Sessions" description="Signed in on a shared or lost device? End every session, including this one." />
      <CardBody>
        <Button variant="secondary" onClick={() => logoutAll.mutate()} loading={logoutAll.isPending}>
          <LogOut className="size-4" aria-hidden /> Log out everywhere
        </Button>
      </CardBody>
    </Card>
  );
}

function download(data: unknown) {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompters-data-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DeleteDialog({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  const qc = useQueryClient();
  const [typed, setTyped] = useState("");
  const del = useMutation({
    mutationFn: () => api.delete("/auth/account", { confirm: typed }),
    onSuccess: () => {
      qc.clear();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    },
  });
  const matches = typed === email;
  return (
    <Dialog open={open} onClose={onClose} title="Delete your account">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (matches) del.mutate();
        }}
        className="space-y-4"
      >
        <p className="text-sm text-muted">
          This permanently deletes your profile, progress, quiz attempts, builds, projects, applications and Readiness history. It cannot be undone. Export your data first if you want a copy.
        </p>
        <Field label={`Type ${email} to confirm`} htmlFor="delete-confirm">
          <Input id="delete-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} className="font-mono" />
        </Field>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" disabled={!matches} loading={del.isPending}>
            <Trash2 className="size-4" aria-hidden /> Delete forever
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function DataCard() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const exportData = useMutation({
    mutationFn: () => api.get<unknown>("/auth/export"),
    onSuccess: (data) => {
      download(data);
      toast.success("Your data export has downloaded.");
    },
  });

  return (
    <Card>
      <CardHeader title="Your data" description="Download or erase everything Prompters stores about you." />
      <CardBody className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => exportData.mutate()} loading={exportData.isPending}>
            <Download className="size-4" aria-hidden /> Export my data
          </Button>
          <Button variant="danger" onClick={() => setOpen(true)} disabled={!me}>
            <Trash2 className="size-4" aria-hidden /> Delete account
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4 text-accent" aria-hidden /> Your data rights (DPDP Act 2023)
          </div>
          <ul className="space-y-1.5 text-sm text-muted">
            <li><span className="font-medium text-text">Access</span> — export a copy of your data as JSON at any time.</li>
            <li><span className="font-medium text-text">Correction</span> — update your details on the Profile page.</li>
            <li><span className="font-medium text-text">Erasure</span> — delete your account and all associated data.</li>
            <li><span className="font-medium text-text">Withdraw consent</span> — deleting your account withdraws consent to process your data.</li>
          </ul>
        </div>
      </CardBody>
      {me && open && <DeleteDialog open={open} onClose={() => setOpen(false)} email={me.email} />}
    </Card>
  );
}
