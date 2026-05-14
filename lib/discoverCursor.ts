import { createHmac, timingSafeEqual } from "node:crypto";

const CURSOR_VERSION = 1 as const;
const MAX_SEEN_IDS = 200;

function signingKey(): string {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || "preference-plus-dev-secret";
}

export type DiscoverCursorPayload = {
  v: typeof CURSOR_VERSION;
  uid: string;
  seen: string[];
};

/** Signed opaque cursor so clients cannot forge exclusion lists for other users. */
export function encodeDiscoverCursor(payload: DiscoverCursorPayload): string {
  const seen = payload.seen.filter((id) => typeof id === "string" && id.length > 0).slice(-MAX_SEEN_IDS);
  const body: DiscoverCursorPayload = { v: CURSOR_VERSION, uid: payload.uid, seen };
  const json = JSON.stringify(body);
  const p = Buffer.from(json, "utf8").toString("base64url");
  const sig = createHmac("sha256", signingKey()).update(p).digest("base64url");
  return `${p}.${sig}`;
}

/** Returns `seen` user ids from a valid cursor, or `null` if invalid / wrong user. */
export function decodeDiscoverCursor(token: string | null, expectedUid: string): string[] | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const p = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!p || !sig) return null;
  const exp = createHmac("sha256", signingKey()).update(p).digest("base64url");
  if (exp.length !== sig.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(exp, "utf8"), Buffer.from(sig, "utf8"))) return null;
  } catch {
    return null;
  }
  let data: DiscoverCursorPayload;
  try {
    data = JSON.parse(Buffer.from(p, "base64url").toString("utf8")) as DiscoverCursorPayload;
  } catch {
    return null;
  }
  if (data.v !== CURSOR_VERSION || data.uid !== expectedUid || !Array.isArray(data.seen)) return null;
  return data.seen.filter((id) => typeof id === "string" && id.length > 0).slice(-MAX_SEEN_IDS);
}
