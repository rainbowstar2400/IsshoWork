import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { workSessions } from "@/db/schema";
import { requireUserId } from "@/lib/auth-helpers";
import { WorkStartBody } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const json = await req.json().catch(() => ({}));
    const body = WorkStartBody.parse(json);

    // 既に進行中があればそれを返す（DB制約でも守られてる）
    const existing = await db.query.workSessions.findFirst({
      where: (t, { and, eq, isNull }) =>
        and(eq(t.userId, userId), isNull(t.endedAt)),
    });
    if (existing) {
      return NextResponse.json({ ok: true, session: existing });
    }

    const inserted = await db
      .insert(workSessions)
      .values({
        userId,
        source: body.source ?? "manual",
      })
      .returning();

    return NextResponse.json({ ok: true, session: inserted[0] });
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status });
  }
}
