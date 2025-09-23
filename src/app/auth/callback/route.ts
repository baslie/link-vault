import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { DEFAULT_AUTH_REDIRECT_PATH, sanitizeRedirectPath } from "@/app/auth/shared";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") ?? DEFAULT_AUTH_REDIRECT_PATH;
  const redirectPath = sanitizeRedirectPath(nextParam);
  const redirectUrl = new URL(redirectPath, requestUrl.origin);

  if (code) {
    const supabase = createSupabaseServerActionClient(cookies());
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error && !redirectUrl.searchParams.has("error")) {
      redirectUrl.searchParams.set("error", "auth_callback");
    }
  }

  const errorDescription = requestUrl.searchParams.get("error_description");

  if (errorDescription && !redirectUrl.searchParams.has("error")) {
    redirectUrl.searchParams.set("error", errorDescription);
  }

  return NextResponse.redirect(redirectUrl);
}
