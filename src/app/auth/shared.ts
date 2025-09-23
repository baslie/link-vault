import { z } from "zod";

export const AUTH_CALLBACK_PATH = "/auth/callback";
export const DEFAULT_AUTH_REDIRECT_PATH = "/app";

export type AuthFormState =
  | { status: "idle"; message?: undefined }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export const authFormInitialState: AuthFormState = { status: "idle" };

export const emailSchema = z.object({
  email: z
    .string({ required_error: "Укажите e-mail" })
    .email("Введите корректный e-mail"),
});

export function sanitizeRedirectPath(
  value: FormDataEntryValue | null | undefined,
  fallback: string = DEFAULT_AUTH_REDIRECT_PATH,
) {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  if (!value.startsWith("/")) {
    return fallback;
  }

  // Prevent open redirect attempts by stripping protocol/host.
  const normalized = value.replace(/\s+/g, "").replace(/\\/g, "/");

  if (normalized.startsWith("//") || normalized.includes("://")) {
    return fallback;
  }

  return normalized;
}
