import { toProxyPhotoUrl } from "@/lib/media";
import type { Intent, Orientation, Profile, Pronouns, Vibe } from "@/lib/types";

const INTENTS: Intent[] = [
  "long-term",
  "short-term",
  "marriage",
  "casual",
  "friends",
  "open-to-anything",
  "ethical-non-monogamy"
];

export function ageFromBirthdate(b: Date | null | undefined): number {
  if (!b) return 27;
  const d = new Date(b);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return Math.max(18, Math.min(80, age));
}

function pickIntent(v: string | null | undefined): Intent {
  const s = (v ?? "open-to-anything").toLowerCase();
  return (INTENTS.includes(s as Intent) ? s : "open-to-anything") as Intent;
}

function seededPersonality(userId: string): Profile["personality"] {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  const n = (shift: number) => 0.38 + ((h >> shift) % 55) / 100;
  return { open: n(0), warm: n(3), driven: n(6), playful: n(9), grounded: n(12) };
}

function seededVibes(userId: string): Vibe[] {
  const pool: Vibe[] = [
    "creative",
    "foodie",
    "intellectual",
    "chill",
    "adventurer",
    "athletic",
    "musical",
    "bookish"
  ];
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 17 + userId.charCodeAt(i)) >>> 0;
  const a = pool[h % pool.length];
  const b = pool[(h >> 4) % pool.length];
  return a === b ? [a] : [a, b];
}

export type DbUserForDiscover = {
  id: string;
  username: string;
  birthdate: Date | null;
  isVerified: boolean;
  isPremium: boolean;
  gender: string | null;
  profile: {
    displayName: string | null;
    bio: string | null;
    city: string | null;
    relationshipIntent: string | null;
    height: number | null;
    weight: number | null;
    ethnicity: string | null;
  } | null;
  profilePhotos: { photoUrl: string; orderIndex: number }[];
  userInterests: { interest: { name: string } }[];
};

export function mapDbUserToProfile(u: DbUserForDiscover): Profile {
  const display = u.profile?.displayName?.trim() || u.username;
  const bio = u.profile?.bio?.trim() || "";
  const city = u.profile?.city?.trim() || "Nearby";
  const intent = pickIntent(u.profile?.relationshipIntent);
  const photos = [...u.profilePhotos]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((p) => ({ kind: "photo" as const, url: toProxyPhotoUrl(p.photoUrl) }));

  const pronouns: Pronouns =
    u.gender === "Male" ? "he/him" : u.gender === "Female" ? "she/her" : "they/them";
  const orientation: Orientation = "bisexual";

  return {
    id: u.id,
    name: display,
    age: ageFromBirthdate(u.birthdate),
    pronouns,
    orientation,
    city,
    distanceKm: 5,
    intent,
    headline: bio.length > 0 ? bio.slice(0, 90) : `${display} on Preference Plus`,
    bio: bio || "Say hi — they’re new here.",
    languages: ["English"],
    vibes: seededVibes(u.id),
    interests: u.userInterests.map((ui) => ui.interest.name).slice(0, 12),
    prompts: [
      { q: "About me", a: bio.slice(0, 120) || "Still writing the good parts." },
      { q: "Looking for", a: intent.replace(/-/g, " ") },
      { q: "Vibes", a: seededVibes(u.id).join(", ") }
    ],
    media: photos.length ? photos : [],
    verified: u.isVerified,
    premium: u.isPremium,
    personality: seededPersonality(u.id),
    height_in: u.profile?.height ?? undefined,
    weight_lb: u.profile?.weight ?? undefined,
    race: u.profile?.ethnicity ?? undefined,
    lastActive: new Date().toISOString()
  };
}

export function passesPreferenceFilters(
  pref: {
    minAge: number | null;
    maxAge: number | null;
    minHeight: number | null;
    maxHeight: number | null;
    minWeightLb: number | null;
    maxWeightLb: number | null;
    preferredEthnicities: string[];
    preferredRelationshipTypes: string[];
    verifiedOnly: boolean;
  },
  u: DbUserForDiscover,
  p: Profile
): boolean {
  if (pref.verifiedOnly && !u.isVerified) return false;
  const age = p.age;
  if (pref.minAge != null && age < pref.minAge) return false;
  if (pref.maxAge != null && age > pref.maxAge) return false;
  if (pref.minHeight != null && typeof p.height_in === "number" && p.height_in < pref.minHeight) return false;
  if (pref.maxHeight != null && typeof p.height_in === "number" && p.height_in > pref.maxHeight) return false;
  if (pref.minWeightLb != null && typeof p.weight_lb === "number" && p.weight_lb < pref.minWeightLb) return false;
  if (pref.maxWeightLb != null && typeof p.weight_lb === "number" && p.weight_lb > pref.maxWeightLb) return false;
  if (pref.preferredEthnicities.length > 0 && p.race && !pref.preferredEthnicities.includes(p.race)) return false;
  if (
    pref.preferredRelationshipTypes.length > 0 &&
    !pref.preferredRelationshipTypes.includes(p.intent)
  ) {
    return false;
  }
  return true;
}
