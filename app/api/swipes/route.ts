import { NextResponse } from "next/server";
import { compatibility } from "@/lib/aiMatcher";
import { loadMeForCompat } from "@/lib/loadMeForCompat";
import { mapDbUserToProfile, type DbUserForDiscover } from "@/lib/mapDiscoverUser";
import { getUserPlan } from "@/lib/planServer";
import { prisma } from "@/lib/prisma";
import { requireMatchingEligibility } from "@/lib/requireMatchingEligibility";
import { requireSession } from "@/lib/serverAuth";
import type { Profile } from "@/lib/types";

type Body = { swipedUserId?: string; type?: string };

function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await requireMatchingEligibility(session.uid);
  if (blocked) return blocked;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const swipedId = (body.swipedUserId ?? "").trim();
  const type = (body.type ?? "").toLowerCase();
  if (!swipedId || !["like", "pass", "superlike"].includes(type)) {
    return NextResponse.json({ error: "swipedUserId and type (like|pass|superlike) required." }, { status: 400 });
  }
  if (swipedId === session.uid) {
    return NextResponse.json({ error: "Invalid swipe target." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: swipedId },
    select: { id: true, deletedAt: true, isBanned: true }
  });
  if (!target || target.deletedAt || target.isBanned) {
    return NextResponse.json({ error: "Profile not available." }, { status: 404 });
  }

  const anyBlock = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: session.uid, blockedId: swipedId },
        { blockerId: swipedId, blockedId: session.uid }
      ]
    },
    select: { blockerId: true }
  });
  if (anyBlock) {
    return NextResponse.json({ error: "You cannot interact with this profile." }, { status: 403 });
  }

  const existing = await prisma.swipe.findFirst({
    where: { swiperId: session.uid, swipedId }
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true, matched: false });
  }

  const plan = await getUserPlan(session.uid);
  if (plan === "explorer" && (type === "like" || type === "superlike")) {
    const start = startOfUtcDay();
    const likesToday = await prisma.swipe.count({
      where: {
        swiperId: session.uid,
        swipeType: { in: ["like", "superlike"] },
        createdAt: { gte: start }
      }
    });
    if (likesToday >= 10) {
      return NextResponse.json(
        { error: "Explorer includes 10 likes per day. Upgrade for unlimited likes." },
        { status: 403 }
      );
    }
  }

  let matched = false;
  let matchId: string | null = null;
  let compatScore = 0;

  await prisma.$transaction(async (tx) => {
    await tx.swipe.create({
      data: {
        swiperId: session.uid,
        swipedId,
        swipeType: type
      }
    });

    if (type === "like" || type === "superlike") {
      const back = await tx.swipe.findFirst({
        where: {
          swiperId: swipedId,
          swipedId: session.uid,
          swipeType: { in: ["like", "superlike"] }
        }
      });
      if (back) {
        const a = session.uid < swipedId ? session.uid : swipedId;
        const b = session.uid < swipedId ? swipedId : session.uid;
        const meModel = await loadMeForCompat(session.uid, tx);
        const them = await tx.user.findUnique({
          where: { id: swipedId },
          include: {
            profile: true,
            profilePhotos: { orderBy: { orderIndex: "asc" } },
            userInterests: { include: { interest: { select: { name: true } } } }
          }
        });
        let score = 82;
        if (meModel && them?.profile) {
          const dto: DbUserForDiscover = {
            id: them.id,
            username: them.username,
            birthdate: them.birthdate,
            isVerified: them.isVerified,
            isPremium: them.isPremium,
            gender: them.gender,
            profile: them.profile,
            profilePhotos: them.profilePhotos,
            userInterests: them.userInterests
          };
          const p: Profile = mapDbUserToProfile(dto);
          score = compatibility(meModel, p);
        }
        const match = await tx.match.upsert({
          where: {
            user1Id_user2Id: { user1Id: a, user2Id: b }
          },
          create: {
            user1Id: a,
            user2Id: b,
            compatibilityScore: score,
            isActive: true
          },
          update: {
            compatibilityScore: score,
            isActive: true
          }
        });
        matched = true;
        matchId = match.id;
        compatScore = match.compatibilityScore ?? score;
      }
    }
  });

  return NextResponse.json({
    ok: true,
    matched,
    matchId,
    compatibility: compatScore
  });
}
