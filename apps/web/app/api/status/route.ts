import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const userId = await requireUserId();

    const session = await db.query.workSessions.findFirst({
      where: (t, { and, eq, isNull }) =>
        and(eq(t.userId, userId), isNull(t.endedAt)),
      with: {
        // drizzleのrelationを入れたくなったら後で。いまは単純に別クエリでもOK
      },
    });

    if (!session) {
      return NextResponse.json({ ok: true, working: false, resting: false });
    }

    const brk = await db.query.breakIntervals.findFirst({
      where: (t, { and, eq, isNull }) =>
        and(eq(t.workSessionId, session.id), isNull(t.endedAt)),
    });

    return NextResponse.json({
      ok: true,
      working: true,
      resting: Boolean(brk),
      session,
      break: brk ?? null,
    });
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status });
  }
}
