import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Ensures the user account is active and onboarding is complete before
 * discover, swipes, likes-you, matches list, or chat APIs run.
 */
export async function requireMatchingEligibility(userId: string): Promise<NextResponse | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { deletedAt: true, isBanned: true, onboardingCompletedAt: true }
  });
  if (!u || u.deletedAt || u.isBanned) {
    return NextResponse.json({ error: "Account unavailable." }, { status: 403 });
  }
  if (!u.onboardingCompletedAt) {
    return NextResponse.json(
      { error: "Finish onboarding to use this feature.", needsOnboarding: true },
      { status: 403 }
    );
  }
  return null;
}
