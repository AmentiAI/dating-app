import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { authConstants, createSessionToken, hashPassword } from "@/lib/auth";
import { clientKeyFromHeaders } from "@/lib/clientKey";
import { prisma } from "@/lib/prisma";
import { slidingWindowAllow } from "@/lib/slidingRateLimit";

type Body = {
  email?: string;
  username?: string;
  password?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  const h = await headers();
  const ip = clientKeyFromHeaders(h);
  if (!slidingWindowAllow(`signup:${ip}`, 6, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many signups from this network. Try again later." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as Body;
    const email = normalizeEmail(body.email ?? "");
    const username = (body.username ?? "").trim();
    const password = body.password ?? "";

    if (!email || !username || !password) {
      return NextResponse.json({ error: "Email, username, and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true, email: true, username: true }
    });
    if (existing) {
      return NextResponse.json({ error: "Email or username already exists." }, { status: 409 });
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          username,
          interestedIn: []
        },
        select: { id: true, email: true, username: true, createdAt: true }
      });
      await tx.authCredential.create({
        data: { userId: created.id, passwordHash: hashPassword(password) }
      });
      await tx.profile.create({
        data: {
          userId: created.id,
          displayName: null,
          bio: null,
          city: null,
          relationshipIntent: null
        }
      });
      await tx.preference.create({
        data: {
          userId: created.id,
          minAge: 25,
          maxAge: 35,
          minHeight: 64,
          maxHeight: 74,
          minWeightLb: 110,
          maxWeightLb: 220,
          maxDistance: 25,
          preferredEthnicities: [],
          preferredReligions: [],
          preferredBodyTypes: [],
          preferredRelationshipTypes: ["long-term", "marriage", "open-to-anything"],
          preferredVibes: [],
          verifiedOnly: false,
          dealbreakers: ["Smoking"]
        }
      });
      return created;
    });

    const res = NextResponse.json({ user });
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
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
