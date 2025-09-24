import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { generateExportCsv } from "@/lib/export/service";
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
    const result = await generateExportCsv(supabase, payload);

    return new Response(result.content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export links", error);
    const message = error instanceof Error ? error.message : "Не удалось сформировать экспорт";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
