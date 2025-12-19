import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * 方針:
 * - 個人情報に寄せないため、users は内部IDのみ（必要が出たら後で足す）
 * - Googleの providerAccountId を identities に保存し、users と紐付ける
 * - 作業セッションは「同時に1つだけ進行中」をDB制約で守る
 * - 休憩も「同時に1つだけ進行中」をDB制約で守る
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const identities = pgTable(
  "identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    provider: text("provider").notNull(), // "google" 等
    providerAccountId: text("provider_account_id").notNull(), // Googleのsub相当

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    // (provider, providerAccountId) は一意
    providerIdentityUnique: uniqueIndex("identities_provider_unique").on(
      t.provider,
      t.providerAccountId
    ),
    userIdIdx: index("identities_user_id_idx").on(t.userId),
  })
);

export const workSessions = pgTable(
  "work_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),

    // 将来の拡張用（例: "manual", "auto" 等）
    source: text("source").notNull().default("manual"),
  },
  (t) => ({
    userIdStartedIdx: index("work_sessions_user_started_idx").on(
      t.userId,
      t.startedAt
    ),

    // 同時に「進行中セッションは1つだけ」
    oneActiveSessionPerUser: uniqueIndex("work_sessions_one_active_per_user")
      .on(t.userId)
      .where(sql`${t.endedAt} is null`),
  })
);

export const breakIntervals = pgTable(
  "break_intervals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workSessionId: uuid("work_session_id")
      .notNull()
      .references(() => workSessions.id, { onDelete: "cascade" }),

    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),

    // 将来: "short", "long" 等にしたければ
    kind: text("kind").notNull().default("manual"),
  },
  (t) => ({
    sessionStartedIdx: index("break_intervals_session_started_idx").on(
      t.workSessionId,
      t.startedAt
    ),

    // 同時に「進行中休憩は1つだけ」
    oneActiveBreakPerSession: uniqueIndex("break_intervals_one_active_per_session")
      .on(t.workSessionId)
      .where(sql`${t.endedAt} is null`),
  })
);
