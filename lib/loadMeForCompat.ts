import type { Prisma } from "@prisma/client";
import { mapDbUserToProfile, type DbUserForDiscover } from "@/lib/mapDiscoverUser";
import { getUserPlan } from "@/lib/planServer";
import { prisma } from "@/lib/prisma";
import type { Me } from "@/lib/types";

export async function loadMeForCompat(
  userId: string,
  db: Prisma.TransactionClient | typeof prisma
): Promise<Me | null> {
  const u = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      preference: true,
      profilePhotos: { orderBy: { orderIndex: "asc" }, take: 1 },
      userInterests: { include: { interest: { select: { name: true } } } }
    }
  });
  if (!u?.profile || !u.preference) return null;

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
  const p = mapDbUserToProfile(dto);
  const pr = u.preference;

  const intents = (pr.preferredRelationshipTypes ?? []) as Me["filters"]["intents"];
  const vibes = (pr.preferredVibes ?? []) as Me["filters"]["vibes"];

  const me: Me = {
    id: u.id,
    name: u.profile.displayName?.trim() || u.username,
    age: p.age,
    pronouns: p.pronouns,
    orientation: p.orientation,
    city: u.profile.city?.trim() || "Nearby",
    intent: p.intent,
    bio: u.profile.bio?.trim() || "",
    vibes: p.vibes,
    interests: p.interests,
    prompts: p.prompts,
    media: p.media,
    personality: p.personality,
    filters: {
      ageRange: [pr.minAge ?? 18, pr.maxAge ?? 80],
      maxDistanceKm: pr.maxDistance ?? 25,
      intents: intents.length ? intents : ["long-term", "marriage", "open-to-anything"],
      vibes,
      verifiedOnly: pr.verifiedOnly,
      heightRange: [pr.minHeight ?? 64, pr.maxHeight ?? 74],
      weightRange: [pr.minWeightLb ?? 110, pr.maxWeightLb ?? 220],
      preferredRaces: pr.preferredEthnicities ?? []
    },
    plan: "explorer",
    premium: u.isPremium,
    boostCredits: 0,
    verified: u.isVerified,
    dealbreakers: pr.dealbreakers ?? [],
    onboarded: u.onboardingCompletedAt != null
  };
  const plan = await getUserPlan(userId);
  me.plan = plan;
  me.premium = plan !== "explorer";
  return me;
}
