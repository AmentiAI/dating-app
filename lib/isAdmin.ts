/**
 * Production: set `ADMIN_EMAILS` (comma-separated) and/or `ADMIN_USER_IDS` (UUIDs).
 * Development: if neither is set, any signed-in user may open `/admin` for local testing.
 */
export function isAdminUser(session: { uid: string; email: string } | null): boolean {
  if (!session) return false;

  const ids = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (ids.length === 0 && emails.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  if (ids.includes(session.uid)) return true;
  if (emails.includes(session.email.trim().toLowerCase())) return true;
  return false;
}
