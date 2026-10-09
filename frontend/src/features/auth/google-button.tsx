"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (o: object) => void; renderButton: (el: HTMLElement, o: object) => void } } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Google Identity Services must be initialised once per page; re-initialising (React re-runs the
// effect in development, and on every remount) logs a warning and can drop the pending callback.
// The single callback forwards to whichever button is mounted now.
let initialised = false;
let onCredential: (credential: string) => void = () => undefined;

/** Google Identity Services button; the backend verifies the ID token. Hidden when not configured. */
export function GoogleButton({ next }: { next: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return;
    onCredential = async (credential) => {
      try {
        await api.post("/auth/google", { credential });
        router.replace(next);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Google sign-in failed.");
      }
    };
    const render = () => {
      if (!window.google) return;
      if (!initialised) {
        window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: ({ credential }: { credential: string }) => onCredential(credential) });
        initialised = true;
      }
      if (ref.current) window.google?.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", width: 304, text: "continue_with", shape: "rectangular" });
    };
    if (window.google) return render();
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", render, { once: true });
      return () => existing.removeEventListener("load", render);
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = render;
    document.head.appendChild(s);
  }, [next, router]);
  if (!CLIENT_ID) return null;
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-subtle"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <div ref={ref} className="flex min-h-10 justify-center" />
    </>
  );
}
