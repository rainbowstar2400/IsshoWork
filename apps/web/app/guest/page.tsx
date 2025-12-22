"use client";

import { useEffect, useMemo, useState } from "react";

export default function GuestPage() {
  const [working, setWorking] = useState(false);
  const [resting, setResting] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [breakStartedAt, setBreakStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const workMs = useMemo(() => {
    if (!startedAt) return 0;
    const base = now - startedAt;
    const breakMs = breakStartedAt ? now - breakStartedAt : 0;
    return Math.max(0, base - breakMs);
  }, [now, startedAt, breakStartedAt]);

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>ゲスト（保存なし）</h1>
      <p style={{ opacity: 0.8 }}>
        このモードはサーバへ一切送信しません。リロードで消えます。
      </p>

      <ul>
        <li>作業中: {working ? "はい" : "いいえ"}</li>
        <li>休憩中: {resting ? "はい" : "いいえ"}</li>
        <li>作業（参考）: {Math.floor(workMs / 1000)} 秒</li>
      </ul>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          disabled={working}
          onClick={() => {
            setWorking(true);
            setStartedAt(Date.now());
          }}
        >
          作業開始
        </button>

        <button
          disabled={!working}
          onClick={() => {
            setWorking(false);
            setResting(false);
            setStartedAt(null);
            setBreakStartedAt(null);
          }}
        >
          作業終了
        </button>

        <button
          disabled={!working || resting}
          onClick={() => {
            setResting(true);
            setBreakStartedAt(Date.now());
          }}
        >
          休憩開始
        </button>

        <button
          disabled={!resting}
          onClick={() => {
            setResting(false);
            setBreakStartedAt(null);
          }}
        >
          休憩終了
        </button>
      </div>
    </main>
  );
}
