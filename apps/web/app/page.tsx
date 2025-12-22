import { auth } from "@/auth";
import Link from "next/link";
import { CharacterPanel } from "../src/components/character-panel";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main style={{ padding: 24 }}>
        <h1>IsshoWork</h1>
        <p>ログインすると作業時間が記録されます。</p>
        <Link href="/api/auth/signin">Googleでログイン</Link>
        <hr />
        <Link href="/guest">ゲスト（保存なし）</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <CharacterPanel />
    </main>
  );
}
