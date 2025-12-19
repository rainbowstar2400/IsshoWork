import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// ここはサーバ側でのみ読み込まれる前提（NEXT_PUBLIC を付けない）
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(databaseUrl);

// drizzle(sql, { schema }) にしておくと、importの見通しがよくなります
export const db = drizzle(sql, { schema });
