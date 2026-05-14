import { NextResponse } from "next/server";
import { compatibility } from "@/lib/aiMatcher";
import {
  candidateInterestedShowsViewer,
  estimateDistanceKm,
  parseLatLng,
  viewerInterestedShowsCandidate
} from "@/lib/discoverPairing";
import { decodeDiscoverCursor, encodeDiscoverCursor } from "@/lib/discoverCursor";
import { getBlockedUserIds } from "@/lib/blockedUserIds";
import { loadMeForCompat } from "@/lib/loadMeForCompat";
import { mapDbUserToProfile, passesPreferenceFilters, type DbUserForDiscover } from "@/lib/mapDiscoverUser";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/serverAuth";
import type { Profile } from "@/lib/types";

const PAGE_SIZE = 24;

function poolSize(alreadySeen: number): number {
  return Math.min(320, 180 + Math.min(alreadySeen, 140));
}

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { preference: true, profile: true }
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
  const maxDistanceKm = pref.maxDistance ?? 25;

  const url = new URL(req.url);
  const cursorParam = url.searchParams.get("cursor");
  const prevSeen = decodeDiscoverCursor(cursorParam, session.uid) ?? [];

  const swiped = await prisma.swipe.findMany({
    where: { swiperId: session.uid },
    select: { swipedId: true }
  });
  const blocked = await getBlockedUserIds(session.uid);

  const matched = await prisma.match.findMany({
    where: {
      isActive: true,
      OR: [{ user1Id: session.uid }, { user2Id: session.uid }]
    },
    select: { user1Id: true, user2Id: true }
  });
  const matchedPartnerIds = matched.map((m) => (m.user1Id === session.uid ? m.user2Id : m.user1Id));

  const excludeIds = new Set<string>([
    session.uid,
    ...swiped.map((s) => s.swipedId),
    ...blocked,
    ...matchedPartnerIds,
    ...prevSeen
  ]);

  const rows = await prisma.user.findMany({
    where: {
      id: { notIn: [...excludeIds] },
      deletedAt: null,
      isBanned: false,
      profilePhotos: { some: {} }
    },
    take: poolSize(prevSeen.length),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      birthdate: true,
      isVerified: true,
      isPremium: true,
      gender: true,
      interestedIn: true,
      profile: true,
      profilePhotos: { orderBy: { orderIndex: "asc" } },
      userInterests: { include: { interest: { select: { name: true } } } }
    }
  });

  const meModel = await loadMeForCompat(session.uid, prisma);
  if (!meModel) {
    return NextResponse.json({ profiles: [] as Profile[] });
  }

  const viewerInterested = me.interestedIn ?? [];
  const viewerGender = me.gender ?? null;
  const viewerLatLng = parseLatLng(me.profile?.latitude, me.profile?.longitude);
  const viewerCity = me.profile?.city ?? null;

  type Scored = { profile: Profile; score: number; premium: boolean };
  const scored: Scored[] = [];

  for (const row of rows) {
    if (!row.profile) continue;
    if (!viewerInterestedShowsCandidate(viewerInterested, row.gender)) continue;
    if (!candidateInterestedShowsViewer(row.interestedIn ?? [], viewerGender)) continue;

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

    const candLatLng = parseLatLng(row.profile.latitude, row.profile.longitude);
    const distanceKm = estimateDistanceKm({
      viewerId: session.uid,
      candidateId: row.id,
      viewerLatLng,
      candidateLatLng: candLatLng,
      viewerCity,
      candidateCity: row.profile.city,
      maxKm: maxDistanceKm
    });
    if (distanceKm > maxDistanceKm) continue;

    const pRanked: Profile = { ...p, distanceKm };
    const base = compatibility(meModel, pRanked);
    const score = base + (row.isPremium ? 0.4 : 0);
    scored.push({ profile: pRanked, score, premium: row.isPremium });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.premium !== b.premium) return (b.premium ? 1 : 0) - (a.premium ? 1 : 0);
    return a.profile.name.localeCompare(b.profile.name);
  });

  const out = scored.slice(0, PAGE_SIZE).map((s) => s.profile);
  const mergedSeen = [...prevSeen, ...out.map((p) => p.id)];
  const nextCursor =
    out.length === PAGE_SIZE
      ? encodeDiscoverCursor({ v: 1, uid: session.uid, seen: mergedSeen })
      : null;

  return NextResponse.json({ profiles: out, nextCursor });
}
