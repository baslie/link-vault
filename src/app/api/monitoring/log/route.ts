import { NextResponse } from "next/server";

import { buildMonitoringRecord, monitoringEventSchema } from "@/lib/monitoring/schema";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let parsed;

  try {
    const body = await request.json();
    parsed = monitoringEventSchema.parse(body);
  } catch (error) {
    console.error("Некорректное событие мониторинга", error);
    return NextResponse.json({ success: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const record = buildMonitoringRecord(parsed);
    const { error } = await supabase.from("monitoring_events").insert(record);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Не удалось сохранить событие мониторинга", error);
    return NextResponse.json({ success: false, error: "persistence_error" }, { status: 500 });
  }
}
