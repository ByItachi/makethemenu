import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db";
import { authTokens } from "@shared/schema";

export type TokenPurpose = "verify_email" | "reset_password";

const TTL_MS: Record<TokenPurpose, number> = {
  verify_email: 24 * 60 * 60_000,
  reset_password: 60 * 60_000,
};

const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");

/** Creates a single-use token. Returns the raw token once; only its hash is stored. */
export async function createToken(userId: number, purpose: TokenPurpose): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await db.insert(authTokens).values({
    userId,
    purpose,
    tokenHash: hash(raw),
    expiresAt: new Date(Date.now() + TTL_MS[purpose]),
  });
  return raw;
}

/**
 * Atomically consumes a token. Returns the user id, or null when the token is unknown,
 * expired, already used or of another purpose.
 */
export async function consumeToken(raw: string, purpose: TokenPurpose): Promise<number | null> {
  if (typeof raw !== "string" || raw.length < 20 || raw.length > 128) return null;
  const tokenHash = hash(raw);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(authTokens)
      .where(and(eq(authTokens.tokenHash, tokenHash), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
      .limit(1);
    if (!row) return null;
    const res: any = await tx.update(authTokens).set({ usedAt: new Date() }).where(and(eq(authTokens.id, row.id), isNull(authTokens.usedAt)));
    if (!res[0]?.affectedRows) return null;
    return row.userId;
  });
}

/** Invalidates all unused tokens of a purpose for a user (used after a password reset). */
export async function invalidateTokens(userId: number, purpose: TokenPurpose): Promise<void> {
  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.userId, userId), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt)));
}
