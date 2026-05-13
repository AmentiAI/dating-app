import { NextResponse } from "next/server";
import { mapDbUserToProfile, passesPreferenceFilters, type DbUserForDiscover } from "@/lib/mapDiscoverUser";
import { getBlockedUserIds } from "@/lib/blockedUserIds";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/serverAuth";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { preference: true }
  });
  if (!me || me.deletedAt || me.isBanned) {
    return NextResponse.json({ error: "Account unavailable." }, { status: 403 });
  }

  if (!me.onboardingCompletedAt) {
    return NextResponse.json(
      { error: "Finish onboarding to use this feature.", needsOnboarding: true },
      { status: 403 }
    );
  }

  if (!me.preference) {
    await prisma.preference.create({
      data: {
        userId: me.id,
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
        dealbreakers: []
      }
    });
  }

  const pref = (await prisma.preference.findUnique({ where: { userId: session.uid } }))!;

  const swiped = await prisma.swipe.findMany({
    where: { swiperId: session.uid },
    select: { swipedId: true }
  });
  const blocked = await getBlockedUserIds(session.uid);
  const excludeIds = [session.uid, ...swiped.map((s) => s.swipedId), ...blocked];

  const rows = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      deletedAt: null,
      isBanned: false,
      profilePhotos: { some: {} }
    },
    take: 80,
    orderBy: { createdAt: "desc" },
    include: {
      profile: true,
      profilePhotos: { orderBy: { orderIndex: "asc" } },
      userInterests: { include: { interest: { select: { name: true } } } }
    }
  });

  const out: ReturnType<typeof mapDbUserToProfile>[] = [];
  for (const row of rows) {
    if (!row.profile) continue;
    const dto: DbUserForDiscover = {
      id: row.id,
      username: row.username,
      birthdate: row.birthdate,
      isVerified: row.isVerified,
      isPremium: row.isPremium,
      gender: row.gender,
      profile: row.profile,
      profilePhotos: row.profilePhotos,
      userInterests: row.userInterests
    };
    const p = mapDbUserToProfile(dto);
    if (p.media.length === 0) continue;
    if (!passesPreferenceFilters(pref, dto, p)) continue;
    out.push(p);
    if (out.length >= 24) break;
  }

  return NextResponse.json({ profiles: out });
}
