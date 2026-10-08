import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const base = "w-full rounded-lg border border-border bg-surface-2/70 px-3 text-sm text-text placeholder:text-subtle transition-colors focus:border-accent focus:bg-surface focus:outline-none disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(base, "h-10", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(base, "min-h-24 py-2 leading-6", className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cn(base, "h-10 pr-8", className)} {...p} />;
});

export function Field({ label, htmlFor, error, hint, children, className }: { label: React.ReactNode; htmlFor?: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block font-mono text-[10px] font-medium tracking-[0.12em] text-text">
        {label}
      </label>
      {children}
      {error ? <p role="alert" className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}
