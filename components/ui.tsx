import * as React from "react";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "success" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "gradient-flow text-white shadow-[var(--shadow-soft)] hover:brightness-110 active:brightness-95",
  secondary:
    "bg-surface text-text border border-[var(--border)] hover:bg-surface-muted",
  ghost: "bg-transparent text-text-muted hover:bg-surface-muted hover:text-text",
  success: "bg-success text-white hover:brightness-110",
  danger: "bg-error text-white hover:brightness-110",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

/** Classes compartilhadas por Button e LinkButton. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold",
    "transition-[filter,background-color,color] duration-150",
    "disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

/**
 * Ancora com aparencia de botao. Existe porque um <a> dentro de <button> e
 * HTML invalido: navegacao usa link, acao usa botao.
 */
export interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function LinkButton({ className, variant = "primary", size = "md", ...props }: LinkButtonProps) {
  return <a className={buttonClasses(variant, size, className)} {...props} />;
}

/* ------------------------------------------------------------------ Card */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border)] bg-surface p-6",
        "shadow-[var(--shadow-soft)]",
        className,
      )}
      {...props}
    />
  );
}

/* ----------------------------------------------------------------- Input */

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-[var(--border)] bg-surface px-4 text-text",
          "placeholder:text-text-muted/70",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-text">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------ ProgressBar */

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-surface-muted", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progresso"}
    >
      <div className="gradient-flow h-full rounded-[var(--radius-pill)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ----------------------------------------------------------------- Badge */

export function Badge({
  children,
  icon,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "brand" | "success" | "error";
  className?: string;
}) {
  const tones = {
    default: "bg-surface-muted text-text",
    brand: "bg-brand/10 text-brand",
    success: "bg-success/12 text-success",
    error: "bg-error/12 text-error",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-sm font-semibold",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* ----------------------------------------------------------- estados base */

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="text-center">
      <p className="font-semibold text-text">{title}</p>
      {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
    </Card>
  );
}

export function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
      {children}
    </p>
  );
}
