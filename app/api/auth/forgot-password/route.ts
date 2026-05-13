import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { clientKeyFromHeaders } from "@/lib/clientKey";
import { hashResetToken, newPlainResetToken } from "@/lib/passwordReset";
import { prisma } from "@/lib/prisma";
import { slidingWindowAllow } from "@/lib/slidingRateLimit";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 8;

function publicMessage() {
  return { ok: true as const, message: "If an account exists for that email, you will receive reset instructions shortly." };
}

export async function POST(req: Request) {
  const h = await headers();
  const ip = clientKeyFromHeaders(h);
  if (!slidingWindowAllow(`forgot:${ip}`, MAX_PER_IP, WINDOW_MS)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || email.length > 254) {
    return NextResponse.json(publicMessage());
  }

  if (!slidingWindowAllow(`forgot:email:${email}`, 3, WINDOW_MS)) {
    return NextResponse.json(publicMessage());
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true }
  });
  if (!user) {
    return NextResponse.json(publicMessage());
  }

  const plain = newPlainResetToken();
  const tokenHash = hashResetToken(plain);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt }
  });

  const origin = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const resetUrl = `${proto}://${origin}/reset-password?token=${encodeURIComponent(plain)}`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Preference Plus <onboarding@resend.dev>";
  if (apiKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [user.email],
          subject: "Reset your Preference Plus password",
          html: `<p>Hi,</p><p><a href="${resetUrl}">Click here to choose a new password</a>.</p><p>This link expires in one hour. If you did not request this, you can ignore this email.</p>`
        })
      });
    } catch {
      /* ignore send failures; still return generic message */
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.info("[dev] password reset link (set RESEND_API_KEY to email in production):", resetUrl);
  }

  return NextResponse.json(publicMessage());
}
