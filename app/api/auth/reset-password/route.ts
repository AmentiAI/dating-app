import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { clientKeyFromHeaders } from "@/lib/clientKey";
import { hashResetToken } from "@/lib/passwordReset";
import { prisma } from "@/lib/prisma";
import { slidingWindowAllow } from "@/lib/slidingRateLimit";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 20;

export async function POST(req: Request) {
  const h = await headers();
  const ip = clientKeyFromHeaders(h);
  if (!slidingWindowAllow(`reset:${ip}`, MAX_PER_IP, WINDOW_MS)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { token?: string; password?: string };
  try {
    body = (await req.json()) as { token?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const password = body.password ?? "";
  if (!token || password.length < 8) {
    return NextResponse.json({ error: "Invalid token or password too short (min 8 characters)." }, { status: 400 });
  }

  const tokenHash = hashResetToken(token);
  const row = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, userId: true }
  });
  if (!row) {
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }

  const cred = await prisma.authCredential.findUnique({
    where: { userId: row.userId },
    select: { id: true }
  });
  if (!cred) {
    return NextResponse.json({ error: "Account has no password set." }, { status: 400 });
  }

  const newHash = hashPassword(password);
  await prisma.$transaction([
    prisma.authCredential.update({
      where: { userId: row.userId },
      data: { passwordHash: newHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() }
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: row.userId, id: { not: row.id } }
    })
  ]);

  return NextResponse.json({ ok: true });
}
