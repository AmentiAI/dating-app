"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Filters, Match, Me, Moment, Profile } from "./types";
import { MOCK_MOMENTS, MOCK_PROFILES } from "./mockData";
import { compatibility, suggestIcebreakers } from "./aiMatcher";

type Decision = "like" | "pass" | "superlike";

type State = {
  me: Me;
  profiles: Profile[];
  decisions: Record<string, Decision>;
  matches: Match[];
  chats: Record<string, ChatMessage[]>;
  moments: Moment[];
  /** ids of profiles who "liked" me (for the Likes tab) */
  likedYou: string[];
  /** boosts active until iso */
  boostUntil?: string;

  // actions
  decide: (profileId: string, decision: Decision) => { matched: boolean; profile?: Profile };
  rewind: () => void;
  sendMessage: (matchId: string, msg: Omit<ChatMessage, "id" | "ts">) => void;
  reactToMessage: (matchId: string, msgId: string, reaction: string) => void;
  toggleMomentLike: (momentId: string) => void;
  updateMe: (patch: Partial<Me>) => void;
  updateFilters: (patch: Partial<Filters>) => void;
  resetDeck: () => void;
  startBoost: (mins: number) => void;
};

const defaultMe: Me = {
  id: "me",
  name: "You",
  age: 28,
  pronouns: "she/her",
  orientation: "bisexual",
  city: "Brooklyn",
  intent: "long-term",
  bio: "Urbanist by training, bartender by accident. Looking for someone who reads the menu out loud in a fake voice.",
  vibes: ["creative", "foodie", "intellectual", "chill"],
  interests: ["natural wine", "indie cinema", "long walks", "thrifting"],
  prompts: [
    { q: "I'm looking for", a: "A partner, not a project." },
    { q: "On a perfect day", a: "Coffee, a long walk, a small dinner, and you." },
    { q: "My green flag", a: "I write thank-you notes." }
  ],
  media: [],
  personality: { open: 0.8, warm: 0.75, driven: 0.7, playful: 0.7, grounded: 0.65 },
  filters: {
    ageRange: [25, 35],
    maxDistanceKm: 25,
    intents: ["long-term", "marriage", "open-to-anything"],
    vibes: [],
    verifiedOnly: false,
    heightRange: [64, 74],
    weightRange: [110, 220],
    preferredRaces: []
  },
  premium: false,
  verified: false,
  dealbreakers: ["smoking"],
  onboarded: false
};

function makeId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      me: defaultMe,
      profiles: MOCK_PROFILES,
      decisions: {},
      matches: [],
      chats: {},
      moments: MOCK_MOMENTS,
      likedYou: ["p_kai", "p_iris", "p_devon"],

      decide: (profileId, decision) => {
        const { decisions, profiles, me, matches, chats } = get();
        const profile = profiles.find((p) => p.id === profileId);
        if (!profile) return { matched: false };

        const newDecisions = { ...decisions, [profileId]: decision };

        // Mock match logic: like or superlike → 60% match if compatibility > 75
        const score = compatibility(me, profile);
        const wantsBack = score >= 78 || decision === "superlike" || Math.random() > 0.55;

        if ((decision === "like" || decision === "superlike") && wantsBack) {
          const match: Match = {
            id: makeId("match"),
            profileId: profile.id,
            matchedAt: new Date().toISOString(),
            compatibility: score,
            icebreakers: suggestIcebreakers(me, profile),
            unread: 1
          };
          const firstMsg: ChatMessage = {
            id: makeId("msg"),
            role: "ai",
            text: `You matched with ${profile.name}. Here are 3 openers tuned to their profile.`,
            ts: new Date().toISOString()
          };
          set({
            decisions: newDecisions,
            matches: [match, ...matches],
            chats: { ...chats, [match.id]: [firstMsg] }
          });
          return { matched: true, profile };
        }

        set({ decisions: newDecisions });
        return { matched: false };
      },

      rewind: () => {
        const { decisions } = get();
        const keys = Object.keys(decisions);
        if (!keys.length) return;
        const last = keys[keys.length - 1];
        const next = { ...decisions };
        delete next[last];
        set({ decisions: next });
      },

      sendMessage: (matchId, partial) => {
        const { chats, matches } = get();
        const list = chats[matchId] ?? [];
        const msg: ChatMessage = { ...partial, id: makeId("msg"), ts: new Date().toISOString() };
        const updated = { ...chats, [matchId]: [...list, msg] };

        // Mock auto-reply from "them" after a like-real delay would normally be timer-driven;
        // we synthesize a reply immediately with role 'them' so chats feel alive on first load.
        const match = matches.find((m) => m.id === matchId);
        if (match && partial.role === "me") {
          const reply: ChatMessage = {
            id: makeId("msg"),
            role: "them",
            text: pickReply(partial.text ?? ""),
            ts: new Date(Date.now() + 1500).toISOString()
          };
          updated[matchId] = [...updated[matchId], reply];
        }
        set({ chats: updated });
      },

      reactToMessage: (matchId, msgId, reaction) => {
        const { chats } = get();
        const list = chats[matchId] ?? [];
        set({
          chats: {
            ...chats,
            [matchId]: list.map((m) => (m.id === msgId ? { ...m, reaction } : m))
          }
        });
      },

      toggleMomentLike: (momentId) => {
        const { moments } = get();
        set({
          moments: moments.map((m) =>
            m.id === momentId
              ? { ...m, liked: !m.liked, likes: m.likes + (m.liked ? -1 : 1) }
              : m
          )
        });
      },

      updateMe: (patch) => set({ me: { ...get().me, ...patch } }),
      updateFilters: (patch) =>
        set({ me: { ...get().me, filters: { ...get().me.filters, ...patch } } }),

      resetDeck: () => set({ decisions: {} }),

      startBoost: (mins) => {
        const until = new Date(Date.now() + mins * 60_000).toISOString();
        set({ boostUntil: until });
      }
    }),
    {
      name: "preference-plus-store-v1",
      partialize: (s) => ({
        me: s.me,
        decisions: s.decisions,
        matches: s.matches,
        chats: s.chats,
        moments: s.moments,
        likedYou: s.likedYou,
        boostUntil: s.boostUntil
      })
    }
  )
);

function pickReply(text: string): string {
  const t = text.toLowerCase();
  if (/\?/.test(text)) {
    const opts = [
      "Honestly? Hard to pick. But if pressed — yes.",
      "Lol depends on the day. Today's answer: absolutely.",
      "Ohhh good question. Give me 24 hours and a coffee.",
      "Yes, but only if you go first."
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }
  if (/hi|hey|hello/.test(t)) return "hey 👋 how's the day treating you?";
  if (/coffee|drink|dinner/.test(t)) return "love this for us. propose a time and I'll meet you there.";
  return "ok now I'm intrigued — tell me more.";
}
