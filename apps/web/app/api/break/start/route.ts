import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { breakIntervals } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";
import { BreakStartBody } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const json = await req.json().catch(() => ({}));
    const body = BreakStartBody.parse(json);

    // 進行中のwork sessionを探す
    const active = await db.query.workSessions.findFirst({
      where: (t, { and, eq, isNull }) =>
        and(eq(t.userId, userId), isNull(t.endedAt)),
    });
    if (!active) {
      return NextResponse.json({ ok: false, error: "No active session" }, { status: 409 });
    }

    // 既に休憩中なら、それを返す
    const existingBreak = await db.query.breakIntervals.findFirst({
      where: (t, { and, eq, isNull }) =>
        and(eq(t.workSessionId, active.id), isNull(t.endedAt)),
    });
    if (existingBreak) {
      return NextResponse.json({ ok: true, break: existingBreak, sessionId: active.id });
    }

    const inserted = await db
      .insert(breakIntervals)
      .values({
        workSessionId: active.id,
        kind: body.kind ?? "manual",
      })
      .returning();

    return NextResponse.json({ ok: true, break: inserted[0], sessionId: active.id });
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status });
  }
}
