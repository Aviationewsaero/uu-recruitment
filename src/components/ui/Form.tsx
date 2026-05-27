import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-brand-text mb-1.5",
        className
      )}
      {...props}
    >
      {props.children}
      {required && <span className="text-red-600 ml-0.5">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-600">{message}</p>;
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-brand-muted">{children}</p>;
}

export function FormField({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-0", className)}>{children}</div>;
}

export function FormRow({
  children,
  cols = 2,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
}) {
  const colsClass =
    cols === 3
      ? "sm:grid-cols-3"
      : cols === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-1";
  return <div className={cn("grid gap-4", colsClass)}>{children}</div>;
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-b border-brand-border pb-6 last:border-0 last:pb-0">
      <div>
        <h3 className="text-lg font-semibold text-brand-text">{title}</h3>
        {description && (
          <p className="text-sm text-brand-muted mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
