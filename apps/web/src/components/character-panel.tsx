"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type StatusResponse =
  | { ok: true; working: false; resting: false }
  | {
      ok: true;
      working: true;
      resting: boolean;
      session: { id: string; startedAt: string; endedAt: string | null };
      break: { id: string; startedAt: string; endedAt: string | null } | null;
    }
  | { ok: false; error: string };

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: "GET", cache: "no-store" });
  return res.json();
}

async function apiPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function msToClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function CharacterPanel() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 休憩タイマー（表示用）
  const [breakEndsAt, setBreakEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const refresh = useCallback(async () => {
    const data = await apiGet<StatusResponse>("/api/status");
    setStatus(data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const breakRemainingMs = useMemo(() => {
    if (!breakEndsAt) return null;
    return breakEndsAt - now;
  }, [breakEndsAt, now]);

  const setSuggestedBreak = (minutes: number) => {
    setBreakEndsAt(Date.now() + minutes * 60_000);
  };

  const doAction = async (path: string, body?: any) => {
    setLoading(true);
    try {
      await apiPost(path, body);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const working = status && "ok" in status && status.ok && status.working;
  const resting = status && "ok" in status && status.ok && "resting" in status && status.resting;

  return (
    <section>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>キャラクター</h1>
          <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
            （ここを覗いたときに状態が分かる、という設計）
          </p>
        </div>
        <a href="/api/auth/signout">ログアウト</a>
      </header>

      <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>いまの状態</h2>

        {!status && <p>読み込み中...</p>}

        {status && "ok" in status && !status.ok && (
          <p style={{ color: "crimson" }}>エラー: {status.error}</p>
        )}

        {status && "ok" in status && status.ok && (
          <>
            <ul>
              <li>作業中: {working ? "はい" : "いいえ"}</li>
              <li>休憩中: {resting ? "はい" : "いいえ"}</li>
            </ul>

            {breakRemainingMs !== null && (
              <p>
                休憩タイマー: {msToClock(breakRemainingMs)}{" "}
                {breakRemainingMs <= 0 ? "（終了）" : ""}
              </p>
            )}
          </>
        )}
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {/* 作業ボタン */}
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>作業</h2>
          <button
            disabled={loading || !!working}
            onClick={() => doAction("/api/work/start", { source: "manual" })}
          >
            作業開始
          </button>{" "}
          <button
            disabled={loading || !working}
            onClick={() => doAction("/api/work/end")}
          >
            作業終了
          </button>
        </div>

        {/* 休憩ボタン＋提案 */}
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>休憩</h2>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button disabled={loading || !working || !!resting} onClick={() => doAction("/api/break/start")}>
              休憩開始
            </button>
            <button disabled={loading || !working || !resting} onClick={() => doAction("/api/break/end")}>
              休憩終了
            </button>
          </div>

          <hr style={{ margin: "12px 0" }} />

          <p style={{ margin: 0, opacity: 0.85 }}>休憩時間の提案（アプリ側から区切る）</p>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button disabled={!working} onClick={() => setSuggestedBreak(5)}>5分</button>
            <button disabled={!working} onClick={() => setSuggestedBreak(10)}>10分</button>
            <button disabled={!working} onClick={() => setSuggestedBreak(15)}>15分</button>
            <button disabled={!working} onClick={() => setBreakEndsAt(null)}>提案を消す</button>
          </div>

          <p style={{ marginTop: 10, opacity: 0.8 }}>
            ※ここでは「タイマー表示」はクライアント側、<br />
            「休憩ログ」は開始/終了ボタンでDBに確定、という分離です。
          </p>
        </div>
      </div>

      {/* キャラクターのクリック演出は次の段階でここに入れます */}
      <div style={{ marginTop: 16, padding: 16, border: "1px dashed #aaa", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>キャラクター演出（次に実装）</h2>
        <p style={{ margin: 0 }}>
          クリック → 状態に応じた反応（セリフは当面無しでもOK）<br />
          ここに画像/アニメ/小さな作業モーションなどを足していきます。
        </p>
      </div>
    </section>
  );
}
