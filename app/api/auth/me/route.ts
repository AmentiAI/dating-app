import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authConstants, readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const token = (await cookies()).get(authConstants.SESSION_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: {
      id: true,
      email: true,
      username: true,
      profile: {
        select: {
          city: true,
          bio: true,
          relationshipIntent: true
        }
      },
      subscriptions: {
        where: { status: { in: ["active", "trialing"] } },
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { plan: true }
      }
    }
  });

  if (!user) return NextResponse.json({ user: null });

  const dbPlan = user.subscriptions[0]?.plan;
  const plan = dbPlan === "plus" || dbPlan === "premium" || dbPlan === "elite" ? dbPlan : "explorer";
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      plan,
      profile: user.profile
        ? {
            city: user.profile.city,
            bio: user.profile.bio,
            intent: user.profile.relationshipIntent
          }
        : null
    }
  });
}
