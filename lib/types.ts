export type Pronouns = "she/her" | "he/him" | "they/them" | "she/they" | "he/they" | "other";
export type Orientation = "straight" | "gay" | "lesbian" | "bisexual" | "pansexual" | "queer" | "asexual" | "other";
export type Intent = "long-term" | "short-term" | "marriage" | "casual" | "friends" | "open-to-anything" | "ethical-non-monogamy";
export type ZodiacSign =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type Vibe =
  | "homebody" | "adventurer" | "creative" | "athletic" | "foodie"
  | "intellectual" | "spiritual" | "ambitious" | "chill" | "party"
  | "outdoorsy" | "techy" | "artsy" | "musical" | "bookish";

export type Prompt = {
  q: string;
  a: string;
  /** optional voice answer (data url or local id) */
  voice?: string;
};

export type MediaItem =
  | { kind: "photo"; url: string; aiVerified?: boolean }
  | { kind: "video"; url: string; poster?: string }
  | { kind: "voice"; url: string; transcript?: string; durationSec: number };

export type Profile = {
  id: string;
  name: string;
  age: number;
  pronouns: Pronouns;
  orientation: Orientation;
  city: string;
  distanceKm: number;
  /** what they're looking for */
  intent: Intent;
  /** short bio / one-liner */
  headline: string;
  bio: string;
  job?: string;
  school?: string;
  height_in?: number;
  weight_lb?: number;
  race?: string;
  zodiac?: ZodiacSign;
  languages: string[];
  vibes: Vibe[];
  interests: string[];
  prompts: Prompt[];
  media: MediaItem[];
  /** verified human via liveness check */
  verified: boolean;
  /** premium account */
  premium: boolean;
  /** AI-derived personality vector — 0..1 across 5 dims */
  personality: { open: number; warm: number; driven: number; playful: number; grounded: number };
  /** dealbreakers user has marked */
  dealbreakers?: string[];
  /** last active iso */
  lastActive: string;
};

export type Match = {
  id: string;
  profileId: string;
  matchedAt: string;
  /** 0..100 ai-derived */
  compatibility: number;
  /** ai-suggested icebreakers */
  icebreakers: string[];
  /** unread? */
  unread: number;
};

export type ChatRole = "me" | "them" | "ai";
export type ChatMessage = {
  id: string;
  role: ChatRole;
  text?: string;
  voiceUrl?: string;
  reaction?: string;
  ts: string;
};

export type Moment = {
  id: string;
  authorId: string;
  caption: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
  liked?: boolean;
};

export type Filters = {
  ageRange: [number, number];
  maxDistanceKm: number;
  intents: Intent[];
  vibes: Vibe[];
  verifiedOnly: boolean;
  heightRange?: [number, number];
  weightRange?: [number, number];
  preferredRaces?: string[];
};

export type Me = {
  id: string;
  name: string;
  age: number;
  pronouns: Pronouns;
  orientation: Orientation;
  city: string;
  intent: Intent;
  bio: string;
  vibes: Vibe[];
  interests: string[];
  prompts: Prompt[];
  media: MediaItem[];
  personality: Profile["personality"];
  filters: Filters;
  premium: boolean;
  verified: boolean;
  dealbreakers: string[];
  /** user's onboarding completion 0..1 */
  onboarded: boolean;
};
