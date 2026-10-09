"use client";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";
import { api, ApiError } from "@/lib/api/client";
import { GoogleButton } from "./google-button";

const loginSchema = z.object({ email: z.string().email("Enter a valid email."), password: z.string().min(1, "Enter your password.") });
const registerSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters.").regex(/[A-Za-z]/, "Include a letter.").regex(/[0-9]/, "Include a number."),
});

type Values = { name?: string; email: string; password: string };

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/dashboard";
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(mode === "login" ? loginSchema : registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await api.post(mode === "login" ? "/auth/login" : "/auth/register", values);
      await qc.invalidateQueries({ queryKey: ["me"] });
      router.replace(mode === "register" ? "/onboarding" : next);
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    }
  });

  return (
    <div className="bg-grid grid min-h-[calc(100vh-72px)] place-items-start justify-items-center px-4 pb-16 pt-16 sm:pt-[70px]">
      <div className="w-full max-w-[360px]">
        <div className="mb-8 text-center">
          <Logo className="justify-center" animate />
          <p className="eyebrow mt-10 text-accent">{mode === "login" ? "Welcome back" : "Get started"}</p>
          <h1 className="font-display mt-2 text-[2.9rem] leading-tight">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted">{mode === "login" ? "Continue where you left off." : "Free to start. Pick Python or JavaScript next."}</p>
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-xl border border-border bg-surface/95 p-7 shadow-[var(--shadow)]">
          {mode === "register" && (
            <Field label="Name" htmlFor="name" error={formState.errors.name?.message}>
              <Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!formState.errors.name} />
            </Field>
          )}
          <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!formState.errors.email} />
          </Field>
          <Field label="Password" htmlFor="password" error={formState.errors.password?.message} hint={mode === "register" ? "8+ characters with a letter and a number." : undefined}>
            <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} aria-invalid={!!formState.errors.password} />
          </Field>
          {serverError && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{serverError}</p>}
          <Button type="submit" variant="ink" className="w-full" loading={formState.isSubmitting}>
            {mode === "login" ? "Log in" : "Create account"} <ArrowUpRight className="size-3.5" aria-hidden />
          </Button>
          <GoogleButton next={mode === "register" ? "/onboarding" : next} />
        </form>
        <p className="mt-3 text-center text-xs text-muted">
          {mode === "login" ? (
            <>New to Prompters? <Link href="/register" className="font-bold text-accent hover:underline">Create an account</Link></>
          ) : (
            <>Already have an account? <Link href="/login" className="font-bold text-accent hover:underline">Log in</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
