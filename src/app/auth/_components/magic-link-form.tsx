"use client";

import { useId } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_AUTH_REDIRECT_PATH,
  type AuthFormState,
  authFormInitialState,
} from "@/app/auth/shared";

interface MagicLinkFormProps {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  pendingLabel: string;
  description?: string;
  redirectPath?: string;
}

export function MagicLinkForm({
  action,
  submitLabel,
  pendingLabel,
  description,
  redirectPath = DEFAULT_AUTH_REDIRECT_PATH,
}: MagicLinkFormProps) {
  const [state, formAction] = useFormState(action, authFormInitialState);
  const emailFieldId = useId();

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor={emailFieldId} className="block text-sm font-medium text-foreground">
          E-mail
        </label>
        <Input
          id={emailFieldId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          aria-invalid={state.status === "error"}
          aria-describedby={state.status !== "idle" ? `${emailFieldId}-message` : undefined}
        />
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <input type="hidden" name="redirect_to" value={redirectPath} />

      <FormMessage id={`${emailFieldId}-message`} state={state} />

      <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
    </form>
  );
}

function FormMessage({ id, state }: { id: string; state: AuthFormState }) {
  if (state.status === "idle") {
    return null;
  }

  const className =
    state.status === "success" ? "text-sm text-emerald-600" : "text-sm text-destructive";

  return (
    <p id={id} role="status" aria-live="polite" className={className}>
      {state.message}
    </p>
  );
}

function SubmitButton({ children, pendingLabel }: { children: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
