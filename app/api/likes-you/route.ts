import { NextResponse } from "next/server";
import { mapDbUserToProfile, type DbUserForDiscover } from "@/lib/mapDiscoverUser";
import { getUserPlan } from "@/lib/planServer";
import { prisma } from "@/lib/prisma";
import { requireMatchingEligibility } from "@/lib/requireMatchingEligibility";
import { requireSession } from "@/lib/serverAuth";

/**
 * People who liked or superliked the current user, excluding anyone you already
 * swiped on or already matched with. Plus/Premium/Elite only.
 */
export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await requireMatchingEligibility(session.uid);
  if (blocked) return blocked;

  const plan = await getUserPlan(session.uid);
  if (plan === "explorer") {
    return NextResponse.json(
      { error: "Who liked you is a Plus feature. Upgrade to unlock." },
      { status: 403 }
    );
  }

  const iSwiped = await prisma.swipe.findMany({
    where: { swiperId: session.uid },
    select: { swipedId: true }
  });
  const iSwipedSet = new Set(iSwiped.map((s) => s.swipedId));

  const myMatches = await prisma.match.findMany({
    where: {
      isActive: true,
      OR: [{ user1Id: session.uid }, { user2Id: session.uid }]
    },
    select: { user1Id: true, user2Id: true }
  });
  const matchedIds = new Set<string>();
  for (const m of myMatches) {
    matchedIds.add(m.user1Id === session.uid ? m.user2Id : m.user1Id);
  }

  const incoming = await prisma.swipe.findMany({
    where: {
      swipedId: session.uid,
      swipeType: { in: ["like", "superlike"] }
    },
    orderBy: { createdAt: "desc" },
    select: { swiperId: true }
  });

  const likerIdsOrdered: string[] = [];
  const seen = new Set<string>();
  for (const row of incoming) {
    const id = row.swiperId;
    if (id === session.uid) continue;
    if (iSwipedSet.has(id)) continue;
    if (matchedIds.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    likerIdsOrdered.push(id);
    if (likerIdsOrdered.length >= 80) break;
  }

  if (likerIdsOrdered.length === 0) {
    return NextResponse.json({ profiles: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: likerIdsOrdered },
      deletedAt: null,
      isBanned: false,
      profile: { isNot: null },
      profilePhotos: { some: {} }
    },
    include: {
      profile: true,
      profilePhotos: { orderBy: { orderIndex: "asc" } },
      userInterests: { include: { interest: { select: { name: true } } } }
    }
  });

  const byId = new Map(users.map((u) => [u.id, u]));
  const out: ReturnType<typeof mapDbUserToProfile>[] = [];
  for (const id of likerIdsOrdered) {
    const row = byId.get(id);
    if (!row?.profile) continue;
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
    out.push(p);
    if (out.length >= 40) break;
  }

  return NextResponse.json({ profiles: out });
}
