import { NextResponse } from "next/server";
import { compatibility, suggestIcebreakers } from "@/lib/aiMatcher";
import { loadMeForCompat } from "@/lib/loadMeForCompat";
import { mapDbUserToProfile, type DbUserForDiscover } from "@/lib/mapDiscoverUser";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/serverAuth";
import type { Match, Profile } from "@/lib/types";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meRow = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { deletedAt: true, isBanned: true }
  });
  if (!meRow || meRow.deletedAt || meRow.isBanned) {
    return NextResponse.json({ error: "Account unavailable." }, { status: 403 });
  }

  const meModel = await loadMeForCompat(session.uid, prisma);
  if (!meModel) {
    return NextResponse.json({ matches: [] as Match[] });
  }

  const rows = await prisma.match.findMany({
    where: {
      isActive: true,
      OR: [{ user1Id: session.uid }, { user2Id: session.uid }]
    },
    orderBy: { matchedAt: "desc" },
    take: 80
  });

  if (rows.length === 0) {
    return NextResponse.json({ matches: [] as Match[] });
  }

  const otherIds = rows.map((r) => (r.user1Id === session.uid ? r.user2Id : r.user1Id));

  const users = await prisma.user.findMany({
    where: {
      id: { in: otherIds },
      deletedAt: null,
      isBanned: false
    },
    include: {
      profile: true,
      profilePhotos: { orderBy: { orderIndex: "asc" } },
      userInterests: { include: { interest: { select: { name: true } } } }
    }
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  const out: Match[] = [];
  for (const row of rows) {
    const otherId = row.user1Id === session.uid ? row.user2Id : row.user1Id;
    const u = byId.get(otherId);
    if (!u?.profile) continue;

    const dto: DbUserForDiscover = {
      id: u.id,
      username: u.username,
      birthdate: u.birthdate,
      isVerified: u.isVerified,
      isPremium: u.isPremium,
      gender: u.gender,
      profile: u.profile,
      profilePhotos: u.profilePhotos,
      userInterests: u.userInterests
    };
    const profile: Profile = mapDbUserToProfile(dto);
    const score = row.compatibilityScore ?? Math.round(compatibility(meModel, profile));
    const firstPhoto = profile.media.find((m) => m.kind === "photo")?.url ?? null;

    out.push({
      id: row.id,
      profileId: otherId,
      matchedAt: row.matchedAt.toISOString(),
      compatibility: score,
      icebreakers: suggestIcebreakers(meModel, profile),
      unread: 0,
      otherName: profile.name,
      otherAge: profile.age,
      otherPhotoUrl: firstPhoto
    });
  }

  return NextResponse.json({ matches: out });
}
