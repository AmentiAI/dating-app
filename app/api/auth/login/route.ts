import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { authConstants, createSessionToken, verifyPassword } from "@/lib/auth";
import { clientKeyFromHeaders } from "@/lib/clientKey";
import { prisma } from "@/lib/prisma";
import { slidingWindowAllow } from "@/lib/slidingRateLimit";

type Body = { email?: string; password?: string };

export async function POST(req: Request) {
  const h = await headers();
  const ip = clientKeyFromHeaders(h);
  if (!slidingWindowAllow(`login:${ip}`, 25, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as Body;
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        onboardingCompletedAt: true,
        authCredential: { select: { passwordHash: true } }
      }
    });

    if (!user?.authCredential || !verifyPassword(password, user.authCredential.passwordHash)) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        onboarded: user.onboardingCompletedAt != null
      }
    });
    const token = createSessionToken({
      uid: user.id,
      email: user.email,
      username: user.username
    });
    res.cookies.set(authConstants.SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: authConstants.SESSION_TTL_SEC,
      path: "/"
    });
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
