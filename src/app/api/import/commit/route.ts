import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { commitImport } from "@/lib/import/commit";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerActionClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Требуется аутентификация" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const result = await commitImport(supabase, payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to commit import", error);
    const message = error instanceof Error ? error.message : "Не удалось выполнить импорт";
    const status = message.includes("аутентификация") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
