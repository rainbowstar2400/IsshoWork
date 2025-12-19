import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "./db/client";
import { identities, users } from "./db/schema";
import { eq, and } from "drizzle-orm";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  // まずはDBセッションではなくJWTで軽く開始（ユーザー/セッション用のAuth.js用テーブルが不要）
  session: { strategy: "jwt" },

  providers: [
    Google({
      // 環境変数で自動的に読む構成も可能ですが、
      // ここでは明示しておく方が分かりやすいです。
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    /**
     * 初回ログイン時:
     * - provider+providerAccountId をキーに identities を探す
     * - 無ければ users を作り、identities を作る
     * - その internal userId を token.userId に詰める
     */
    async jwt({ token, account }) {
      if (!account) return token;

      const provider = account.provider;
      const providerAccountId = account.providerAccountId;

      if (!provider || !providerAccountId) return token;

      // 既存の紐付けを確認
      const existing = await db.query.identities.findFirst({
        where: (t, { and, eq }) =>
          and(eq(t.provider, provider), eq(t.providerAccountId, providerAccountId)),
      });

      let internalUserId: string;

      if (existing) {
        internalUserId = existing.userId;
      } else {
        const createdUser = await db
          .insert(users)
          .values({})
          .returning({ id: users.id });

        internalUserId = createdUser[0]!.id;

        await db.insert(identities).values({
          userId: internalUserId,
          provider,
          providerAccountId,
        });
      }

      token.userId = internalUserId;
      return token;
    },

    /**
     * session.user.id を生やす（API側が userId を取りやすいように）
     */
    async session({ session, token }) {
      if (session.user && token.userId) {
        // `next-auth.d.ts` で型も拡張します
        session.user.id = String(token.userId);
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;
