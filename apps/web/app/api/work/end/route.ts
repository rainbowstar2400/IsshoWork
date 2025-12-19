import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { workSessions } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";
import { and, eq, isNull } from "drizzle-orm";

export async function POST() {
  try {
    const userId = await requireUserId();

    // ended_at is null の行だけを更新するので、これは原子的に安全
    const updated = await db
      .update(workSessions)
      .set({ endedAt: new Date() })
      .where(and(eq(workSessions.userId, userId), isNull(workSessions.endedAt)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ ok: false, error: "No active session" }, { status: 409 });
    }

    return NextResponse.json({ ok: true, session: updated[0] });
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status });
  }
}
