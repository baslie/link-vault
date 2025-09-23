"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import {
  AUTH_CALLBACK_PATH,
  DEFAULT_AUTH_REDIRECT_PATH,
  type AuthFormState,
  emailSchema,
  sanitizeRedirectPath,
} from "@/app/auth/shared";

const SUCCESS_SIGN_IN_MESSAGE = "Мы отправили ссылку для входа на указанный e-mail.";
const SUCCESS_SIGN_UP_MESSAGE = "Подтвердите регистрацию по ссылке, отправленной на e-mail.";
const GENERIC_ERROR_MESSAGE = "Не удалось отправить ссылку. Попробуйте ещё раз.";

function resolveSiteUrl() {
  const origin = headers().get("origin");

  if (origin && origin.startsWith("http")) {
    return origin;
  }

  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (publicUrl && publicUrl.startsWith("http")) {
    return publicUrl;
  }

  return "http://localhost:3000";
}

function buildCallbackUrl(origin: string, redirectPath: string) {
  const url = new URL(AUTH_CALLBACK_PATH, origin);

  if (redirectPath && redirectPath !== DEFAULT_AUTH_REDIRECT_PATH) {
    url.searchParams.set("next", redirectPath);
  }

  return url.toString();
}

export async function signInWithEmail(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerActionClient(cookieStore);

  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? GENERIC_ERROR_MESSAGE;

    return { status: "error", message };
  }

  const redirectPath = sanitizeRedirectPath(formData.get("redirect_to"));
  const emailRedirectTo = buildCallbackUrl(resolveSiteUrl(), redirectPath);

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo,
      shouldCreateUser: false,
    },
  });

  if (error) {
    return {
      status: "error",
      message: GENERIC_ERROR_MESSAGE,
    };
  }

  return {
    status: "success",
    message: SUCCESS_SIGN_IN_MESSAGE,
  };
}

export async function signUpWithEmail(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerActionClient(cookieStore);

  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? GENERIC_ERROR_MESSAGE;

    return { status: "error", message };
  }

  const redirectPath = sanitizeRedirectPath(formData.get("redirect_to"));
  const emailRedirectTo = buildCallbackUrl(resolveSiteUrl(), redirectPath);

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      status: "error",
      message: GENERIC_ERROR_MESSAGE,
    };
  }

  return {
    status: "success",
    message: SUCCESS_SIGN_UP_MESSAGE,
  };
}

export async function signInWithGoogle(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerActionClient(cookieStore);

  const redirectPath = sanitizeRedirectPath(formData.get("redirect_to"));
  const callbackUrl = buildCallbackUrl(resolveSiteUrl(), redirectPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data?.url) {
    redirect("/auth/sign-in?error=google");
  }

  redirect(data.url);
}

export async function signOut() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerActionClient(cookieStore);

  await supabase.auth.signOut();

  redirect("/");
}
