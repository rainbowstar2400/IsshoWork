import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { requireUserId } from "@/lib/auth-helpers";
import { breakIntervals, workSessions } from "@/db/schema";
import { and, eq, isNotNull, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const userId = await requireUserId();

    const sessions = await db.query.workSessions.findMany({
      where: (t, { and, eq, isNotNull }) =>
        and(eq(t.userId, userId), isNotNull(t.endedAt)),
      columns: { id: true, startedAt: true, endedAt: true },
      orderBy: (t, { desc }) => desc(t.startedAt),
      limit: 200, // MVPなので上限。後で期間指定APIにする
    });

    const sessionIds = sessions.map((s) => s.id);
    const breaks = sessionIds.length
      ? await db.query.breakIntervals.findMany({
          where: (t, { inArray, isNotNull }) =>
            and(inArray(t.workSessionId, sessionIds), isNotNull(t.endedAt)),
          columns: { workSessionId: true, startedAt: true, endedAt: true },
        })
      : [];

    // ざっくり集計（後でSQLでまとめて計算してもOK）
    const ms = (d: Date) => d.getTime();

    let workMs = 0;
    for (const s of sessions) {
      workMs += ms(s.endedAt!) - ms(s.startedAt);
    }

    let breakMs = 0;
    for (const b of breaks) {
      breakMs += ms(b.endedAt!) - ms(b.startedAt);
    }

    const netMs = Math.max(0, workMs - breakMs);

    return NextResponse.json({
      ok: true,
      totals: {
        sessionCount: sessions.length,
        workMs,
        breakMs,
        netMs,
      },
    });
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status });
  }
}
