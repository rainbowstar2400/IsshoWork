import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { breakIntervals } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";
import { and, eq, isNull } from "drizzle-orm";

export async function POST() {
  try {
    const userId = await requireUserId();

    // 進行中sessionを探す
    const active = await db.query.workSessions.findFirst({
      where: (t, { and, eq, isNull }) =>
        and(eq(t.userId, userId), isNull(t.endedAt)),
    });
    if (!active) {
      return NextResponse.json({ ok: false, error: "No active session" }, { status: 409 });
    }

    const updated = await db
      .update(breakIntervals)
      .set({ endedAt: new Date() })
      .where(
        and(
          eq(breakIntervals.workSessionId, active.id),
          isNull(breakIntervals.endedAt)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ ok: false, error: "No active break" }, { status: 409 });
    }

    return NextResponse.json({ ok: true, break: updated[0], sessionId: active.id });
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status });
  }
}
