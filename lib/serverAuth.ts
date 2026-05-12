import { cookies } from "next/headers";
import { authConstants, readSessionToken } from "@/lib/auth";

export async function requireSession() {
  const token = (await cookies()).get(authConstants.SESSION_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session) return null;
  return session;
}
