import { createHmac, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "pp_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 14; // 14 days

type SessionPayload = {
  uid: string;
  email: string;
  username: string;
  exp: number;
};

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || "preference-plus-dev-secret";
}

export function hashPassword(password: string): string {
  const salt = randomUUID().replace(/-/g, "");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHex] = stored.split(":");
  if (!salt || !originalHex) return false;
  const compareHex = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(compareHex, "hex"), Buffer.from(originalHex, "hex"));
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createSessionToken(input: Omit<SessionPayload, "exp">): string {
  const payload: SessionPayload = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC
  };
  const base = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${base}.${sign(base)}`;
}

export function readSessionToken(token?: string): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [base, sig] = token.split(".");
  if (!base || !sig) return null;
  if (sign(base) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8")) as SessionPayload;
    if (!payload?.uid || !payload?.email || !payload?.username) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const authConstants = {
  SESSION_COOKIE,
  SESSION_TTL_SEC
};
