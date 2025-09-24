import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildImportPreview } from "@/lib/import/preview";
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
    const result = await buildImportPreview(supabase, user.id, payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to build import preview", error);
    const message = error instanceof Error ? error.message : "Не удалось построить предпросмотр";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
