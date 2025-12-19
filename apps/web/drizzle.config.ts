import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // マイグレーションは direct を推奨（poolerや特殊経路だと詰まりやすい）
    url: process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL!,
  },
} satisfies Config;
