import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import {
  parseLinksSearchParams,
  searchLinks,
  type LinkListQueryFilters,
  LinksQueryValidationError,
} from "@/lib/links/query";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

function buildBadRequestResponse(message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status: 400 },
  );
}

function buildErrorResponse(error: unknown) {
  if (error instanceof LinksQueryValidationError) {
    return buildBadRequestResponse(error.message);
  }

  if (error instanceof ZodError) {
    return buildBadRequestResponse("Некорректные параметры запроса", error.flatten());
  }

  const message = error instanceof Error ? error.message : "Неизвестная ошибка";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerActionClient(cookies());
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Требуется аутентификация" }, { status: 401 });
  }

  let filters: LinkListQueryFilters;
  try {
    filters = parseLinksSearchParams(request.nextUrl.searchParams);
  } catch (error) {
    return buildErrorResponse(error);
  }

  try {
    const result = await searchLinks(supabase, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch links", error);
    return buildErrorResponse(error);
  }
}
