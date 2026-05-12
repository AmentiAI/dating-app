import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/serverAuth";
import { toProxyPhotoUrl } from "@/lib/media";
import type { Intent, Vibe } from "@/lib/types";

const INTENTS: Intent[] = [
  "long-term",
  "short-term",
  "marriage",
  "casual",
  "friends",
  "open-to-anything",
  "ethical-non-monogamy"
];

const VIBES: Vibe[] = [
  "homebody",
  "adventurer",
  "creative",
  "athletic",
  "foodie",
  "intellectual",
  "spiritual",
  "ambitious",
  "chill",
  "party",
  "outdoorsy",
  "techy",
  "artsy",
  "musical",
  "bookish"
];

function defaultPreferenceData(userId: string) {
  return {
    userId,
    minAge: 25,
    maxAge: 35,
    minHeight: 64,
    maxHeight: 74,
    minWeightLb: 110,
    maxWeightLb: 220,
    maxDistance: 25,
    preferredEthnicities: [] as string[],
    preferredReligions: [] as string[],
    preferredBodyTypes: [] as string[],
    preferredRelationshipTypes: ["long-term", "marriage", "open-to-anything"],
    preferredVibes: [] as string[],
    verifiedOnly: false,
    dealbreakers: ["Smoking"] as string[]
  };
}

async function ensureProfileRows(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      preference: true,
      profilePhotos: { orderBy: { orderIndex: "asc" } },
      userInterests: { include: { interest: { select: { name: true } } } }
    }
  });
  if (!user) return null;

  if (!user.profile) {
    await prisma.profile.create({
      data: { userId, bio: null, city: null, relationshipIntent: null, displayName: null }
    });
  }
  if (!user.preference) {
    await prisma.preference.create({ data: defaultPreferenceData(userId) });
  }

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      preference: true,
      profilePhotos: { orderBy: { orderIndex: "asc" } },
      userInterests: { include: { interest: { select: { name: true } } } }
    }
  });
}

function pickIntent(v: string | null | undefined): Intent {
  const s = (v ?? "long-term").toLowerCase();
  return (INTENTS.includes(s as Intent) ? s : "long-term") as Intent;
}

function pickIntents(arr: string[]): Intent[] {
  return arr.map((x) => pickIntent(x)).filter((x, i, a) => a.indexOf(x) === i);
}

function pickVibes(arr: string[]): Vibe[] {
  return arr.filter((x): x is Vibe => VIBES.includes(x as Vibe));
}

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await ensureProfileRows(session.uid);
  if (!user?.profile || !user.preference) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const p = user.profile;
  const pref = user.preference;
  const display = p.displayName?.trim() || user.username;

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    username: user.username,
    displayName: p.displayName,
    name: display,
    city: p.city ?? "",
    bio: p.bio ?? "",
    intent: pickIntent(p.relationshipIntent),
    interests: user.userInterests.map((ui) => ui.interest.name),
    photoUrls: user.profilePhotos.map((ph) => toProxyPhotoUrl(ph.photoUrl)),
    filters: {
      ageRange: [pref.minAge ?? 18, pref.maxAge ?? 80] as [number, number],
      maxDistanceKm: pref.maxDistance ?? 25,
      heightRange: [pref.minHeight ?? 64, pref.maxHeight ?? 74] as [number, number],
      weightRange: [pref.minWeightLb ?? 110, pref.maxWeightLb ?? 220] as [number, number],
      intents: pickIntents(pref.preferredRelationshipTypes ?? []),
      vibes: pickVibes(pref.preferredVibes ?? []),
      preferredRaces: pref.preferredEthnicities ?? [],
      verifiedOnly: pref.verifiedOnly
    },
    dealbreakers: pref.dealbreakers ?? []
  });
}

type PatchBody = {
  name?: string;
  city?: string;
  bio?: string;
  intent?: string;
  interests?: string[];
  photoUrls?: string[];
  filters?: {
    ageRange?: [number, number];
    maxDistanceKm?: number;
    heightRange?: [number, number];
    weightRange?: [number, number];
    intents?: string[];
    vibes?: string[];
    preferredRaces?: string[];
    verifiedOnly?: boolean;
  };
  dealbreakers?: string[];
};

export async function PATCH(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await ensureProfileRows(session.uid);
  if (!user?.profile || !user.preference) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const intent = pickIntent(body.intent ?? user.profile.relationshipIntent);
  const displayName = (body.name ?? user.profile.displayName ?? user.username).trim().slice(0, 80) || null;

  const f = body.filters ?? {};
  const age = f.ageRange ?? [user.preference.minAge ?? 18, user.preference.maxAge ?? 80];
  const height = f.heightRange ?? [user.preference.minHeight ?? 64, user.preference.maxHeight ?? 74];
  const weight = f.weightRange ?? [user.preference.minWeightLb ?? 110, user.preference.maxWeightLb ?? 220];

  const interests = Array.isArray(body.interests)
    ? body.interests.map((s) => s.trim()).filter(Boolean).slice(0, 30)
    : undefined;

  const photoUrls = Array.isArray(body.photoUrls)
    ? body.photoUrls.filter((u) => typeof u === "string" && u.length > 0).slice(0, 6)
    : undefined;

  const dealbreakers = Array.isArray(body.dealbreakers)
    ? body.dealbreakers.map((s) => String(s).trim()).filter(Boolean).slice(0, 20)
    : undefined;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { userId: session.uid },
        data: {
          displayName,
          city: body.city !== undefined ? body.city.trim().slice(0, 120) || null : undefined,
          bio: body.bio !== undefined ? body.bio.trim().slice(0, 2000) || null : undefined,
          relationshipIntent: intent
        }
      });

      await tx.preference.update({
        where: { userId: session.uid },
        data: {
          minAge: Math.min(age[0], age[1]),
          maxAge: Math.max(age[0], age[1]),
          minHeight: Math.min(height[0], height[1]),
          maxHeight: Math.max(height[0], height[1]),
          minWeightLb: Math.min(weight[0], weight[1]),
          maxWeightLb: Math.max(weight[0], weight[1]),
          maxDistance:
            typeof f.maxDistanceKm === "number" && Number.isFinite(f.maxDistanceKm)
              ? Math.max(1, Math.min(500, Math.round(f.maxDistanceKm)))
              : undefined,
          preferredEthnicities: Array.isArray(f.preferredRaces) ? f.preferredRaces : undefined,
          preferredRelationshipTypes: Array.isArray(f.intents) ? pickIntents(f.intents) : undefined,
          preferredVibes: Array.isArray(f.vibes) ? pickVibes(f.vibes) : undefined,
          verifiedOnly: typeof f.verifiedOnly === "boolean" ? f.verifiedOnly : undefined,
          dealbreakers: dealbreakers ?? undefined
        }
      });

      if (interests) {
        await tx.userInterest.deleteMany({ where: { userId: session.uid } });
        const uniq = [...new Set(interests)];
        for (const raw of uniq) {
          const name = raw.slice(0, 80);
          const interest = await tx.interest.upsert({
            where: { name },
            create: { name },
            update: {},
            select: { id: true }
          });
          await tx.userInterest.create({
            data: { userId: session.uid, interestId: interest.id }
          });
        }
      }

      if (photoUrls) {
        await tx.profilePhoto.deleteMany({ where: { userId: session.uid } });
        let i = 0;
        for (const url of photoUrls) {
          await tx.profilePhoto.create({
            data: {
              userId: session.uid,
              photoUrl: url.trim().slice(0, 2048),
              orderIndex: i++
            }
          });
        }
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const next = await ensureProfileRows(session.uid);
  if (!next?.profile || !next.preference) {
    return NextResponse.json({ error: "Reload failed" }, { status: 500 });
  }

  const p = next.profile;
  const pref = next.preference;
  const display = p.displayName?.trim() || next.username;

  return NextResponse.json({
    userId: next.id,
    email: next.email,
    username: next.username,
    displayName: p.displayName,
    name: display,
    city: p.city ?? "",
    bio: p.bio ?? "",
    intent: pickIntent(p.relationshipIntent),
    interests: next.userInterests.map((ui) => ui.interest.name),
    photoUrls: next.profilePhotos.map((ph) => toProxyPhotoUrl(ph.photoUrl)),
    filters: {
      ageRange: [pref.minAge ?? 18, pref.maxAge ?? 80] as [number, number],
      maxDistanceKm: pref.maxDistance ?? 25,
      heightRange: [pref.minHeight ?? 64, pref.maxHeight ?? 74] as [number, number],
      weightRange: [pref.minWeightLb ?? 110, pref.maxWeightLb ?? 220] as [number, number],
      intents: pickIntents(pref.preferredRelationshipTypes ?? []),
      vibes: pickVibes(pref.preferredVibes ?? []),
      preferredRaces: pref.preferredEthnicities ?? [],
      verifiedOnly: pref.verifiedOnly
    },
    dealbreakers: pref.dealbreakers ?? []
  });
}
