import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  fetchAndCacheMetadata,
  MetadataServiceError,
  type MetadataStorageClient,
} from "@/lib/metadata/service";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

const querySchema = z.object({
  url: z.string().url(),
});

export async function GET(request: NextRequest) {
  const rawSupabase = createSupabaseServerActionClient(cookies());
  const supabase = rawSupabase as MetadataStorageClient & typeof rawSupabase;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Требуется аутентификация" }, { status: 401 });
  }

  const parseResult = querySchema.safeParse({ url: request.nextUrl.searchParams.get("url") });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Некорректный URL",
        details: parseResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const metadata = await fetchAndCacheMetadata({
      supabase,
      userId: user.id,
      url: parseResult.data.url,
    });

    return NextResponse.json({ metadata });
  } catch (error) {
    if (error instanceof MetadataServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to fetch metadata", error);
    return NextResponse.json({ error: "Не удалось получить метаданные" }, { status: 500 });
  }
}
