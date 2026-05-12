import type { Me, Profile } from "./types";

/**
 * Cosine-similarity-ish compatibility score across the 5 personality dims,
 * boosted by shared vibes / intent alignment / distance penalty.
 *
 * Output: 0..100 integer.
 */
export function compatibility(me: Me, p: Profile): number {
  const a = me.personality;
  const b = p.personality;
  const dot = a.open * b.open + a.warm * b.warm + a.driven * b.driven + a.playful * b.playful + a.grounded * b.grounded;
  const ma = Math.sqrt(a.open ** 2 + a.warm ** 2 + a.driven ** 2 + a.playful ** 2 + a.grounded ** 2);
  const mb = Math.sqrt(b.open ** 2 + b.warm ** 2 + b.driven ** 2 + b.playful ** 2 + b.grounded ** 2);
  const cos = ma && mb ? dot / (ma * mb) : 0;

  // shared vibes (Jaccard)
  const setA = new Set(me.vibes);
  const setB = new Set(p.vibes);
  const inter = [...setA].filter((v) => setB.has(v)).length;
  const union = new Set([...setA, ...setB]).size || 1;
  const vibeScore = inter / union;

  // intent alignment
  const intentBonus = me.intent === p.intent ? 0.1 : me.intent === "open-to-anything" || p.intent === "open-to-anything" ? 0.05 : 0;

  // distance penalty (within filter)
  const dist = Math.min(p.distanceKm / Math.max(me.filters.maxDistanceKm, 1), 1);
  const distPenalty = dist * 0.08;

  // verification halo
  const verifyBonus = p.verified ? 0.03 : 0;

  const raw = cos * 0.65 + vibeScore * 0.25 + intentBonus + verifyBonus - distPenalty;
  const pct = Math.max(0, Math.min(1, raw));
  // softly compress so most scores live in 65..96 — feels more "AI-curated"
  const compressed = 0.6 + pct * 0.36;
  return Math.round(compressed * 100);
}

/**
 * AI-style icebreaker generator: pulls the most distinctive thing from their
 * profile and forms an opener. Deterministic from the profile so it doesn't
 * thrash between renders.
 */
export function suggestIcebreakers(me: Me, p: Profile): string[] {
  const out: string[] = [];
  const firstPrompt = p.prompts[0];
  if (firstPrompt) {
    out.push(`Re: "${firstPrompt.q}" — ${riffOn(firstPrompt.a)}`);
  }
  const sharedVibe = me.vibes.find((v) => p.vibes.includes(v));
  if (sharedVibe) out.push(`Both ${sharedVibe} energy. What's your version of a perfect ${sharedVibe} Saturday?`);
  const interest = p.interests[0];
  if (interest) out.push(`Need a strong opinion: best place in the city for ${interest}?`);
  if (out.length < 3) out.push(`If we had 30 minutes and zero plan, what would you pick?`);
  return out.slice(0, 3);
}

function riffOn(answer: string): string {
  if (answer.length < 60) return `Okay, but expand on that — I need the director's commentary.`;
  return `Wait that's actually great. Counter-question: would you do it again tomorrow?`;
}

/**
 * Returns short reasons WHY this profile matches — drives the "AI compatibility"
 * card on each profile.
 */
export function compatibilityReasons(me: Me, p: Profile): string[] {
  const reasons: string[] = [];
  const sharedVibes = me.vibes.filter((v) => p.vibes.includes(v));
  if (sharedVibes.length) reasons.push(`Both ${sharedVibes.slice(0, 2).join(" + ")}`);
  if (me.intent === p.intent) reasons.push(`Same intent: ${me.intent.replace("-", " ")}`);
  if (Math.abs(me.personality.warm - p.personality.warm) < 0.2) reasons.push("Matched warmth");
  if (Math.abs(me.personality.driven - p.personality.driven) < 0.2) reasons.push("Same drive");
  if (p.verified) reasons.push("Verified human");
  return reasons.slice(0, 4);
}

/** Generate 3 AI date plans for a match given shared vibes & city */
export function suggestDates(me: Me, p: Profile): { title: string; subtitle: string; emoji: string }[] {
  const ideas: { title: string; subtitle: string; emoji: string }[] = [];
  if (p.vibes.includes("foodie") || me.vibes.includes("foodie"))
    ideas.push({ title: "Hand-roll night", subtitle: "Omakase counter in the East Village, 6:30pm", emoji: "🍣" });
  if (p.vibes.includes("artsy") || p.vibes.includes("creative"))
    ideas.push({ title: "First Saturdays at the Brooklyn Museum", subtitle: "Free entry, low pressure, lots to react to", emoji: "🎨" });
  if (p.vibes.includes("outdoorsy") || p.vibes.includes("athletic"))
    ideas.push({ title: "Sunset walk on the Greenway", subtitle: "Pier 6 → Dumbo, ice cream optional", emoji: "🌅" });
  if (p.vibes.includes("musical") || p.vibes.includes("party"))
    ideas.push({ title: "House show + late-night ramen", subtitle: "Public Records, then Cocoron", emoji: "🎧" });
  if (ideas.length < 3) ideas.push({ title: "Walk + coffee experiment", subtitle: "Three cafés in 90 minutes, rate them", emoji: "☕" });
  return ideas.slice(0, 3);
}
