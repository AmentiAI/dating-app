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
  typingByMatch: Record<string, boolean>;
  dailyLikesUsed: number;
  dailyLikesDate: string;

  // actions
  decide: (profileId: string, decision: Decision) => { matched: boolean; profile?: Profile; blocked?: string };
  rewind: () => void;
  sendMessage: (matchId: string, msg: Omit<ChatMessage, "id" | "ts">) => void;
  reactToMessage: (matchId: string, msgId: string, reaction: string) => void;
  toggleMomentLike: (momentId: string) => void;
  updateMe: (patch: Partial<Me>) => void;
  updateFilters: (patch: Partial<Filters>) => void;
  setPlan: (plan: Me["plan"]) => void;
  addBoostCredits: (count: number) => void;
  resetDeck: () => void;
  startBoost: (mins: number) => void;
  markMatchRead: (matchId: string) => void;
  likeBack: (profileId: string) => { matchId?: string };
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
  plan: "explorer",
  premium: false,
  boostCredits: 0,
  verified: false,
  dealbreakers: ["smoking"],
  onboarded: false
};

function makeId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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
      typingByMatch: {},
      dailyLikesUsed: 0,
      dailyLikesDate: todayKey(),

      decide: (profileId, decision) => {
        const { decisions, profiles, me, matches, chats } = get();
        const profile = profiles.find((p) => p.id === profileId);
        if (!profile) return { matched: false };
        const isLike = decision === "like" || decision === "superlike";
        const today = todayKey();
        let likesUsed = get().dailyLikesUsed;
        if (get().dailyLikesDate !== today) {
          likesUsed = 0;
          set({ dailyLikesUsed: 0, dailyLikesDate: today });
        }
        if (me.plan === "explorer" && isLike && likesUsed >= 10) {
          return { matched: false, blocked: "Explorer includes 10 likes per day. Upgrade for unlimited likes." };
        }

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
            chats: { ...chats, [match.id]: [firstMsg] },
            dailyLikesUsed: isLike ? likesUsed + 1 : likesUsed,
            dailyLikesDate: today
          });
          return { matched: true, profile };
        }

        set({
          decisions: newDecisions,
          dailyLikesUsed: isLike ? likesUsed + 1 : likesUsed,
          dailyLikesDate: today
        });
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
        const { chats, matches, typingByMatch } = get();
        const list = chats[matchId] ?? [];
        const msg: ChatMessage = { ...partial, id: makeId("msg"), ts: new Date().toISOString() };
        const updated = { ...chats, [matchId]: [...list, msg] };
        const match = matches.find((m) => m.id === matchId);
        if (match && partial.role === "me") {
          set({ chats: updated, typingByMatch: { ...typingByMatch, [matchId]: true } });
          setTimeout(() => {
            const curr = get();
            const currThread = curr.chats[matchId] ?? [];
            const reply: ChatMessage = {
              id: makeId("msg"),
              role: "them",
              text: pickReply(partial.text ?? ""),
              ts: new Date().toISOString()
            };
            set({
              chats: { ...curr.chats, [matchId]: [...currThread, reply] },
              matches: curr.matches.map((m) => (m.id === matchId ? { ...m, unread: m.unread + 1 } : m)),
              typingByMatch: { ...curr.typingByMatch, [matchId]: false }
            });
          }, 1200);
          return;
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
      setPlan: (plan) =>
        set({
          me: {
            ...get().me,
            plan,
            premium: plan !== "explorer"
          }
        }),
      addBoostCredits: (count) =>
        set({
          me: {
            ...get().me,
            boostCredits: Math.max(0, get().me.boostCredits + count)
          }
        }),

      resetDeck: () => set({ decisions: {} }),

      startBoost: (mins) => {
        const until = new Date(Date.now() + mins * 60_000).toISOString();
        set({ boostUntil: until });
      },

      markMatchRead: (matchId) =>
        set({
          matches: get().matches.map((m) => (m.id === matchId ? { ...m, unread: 0 } : m))
        }),

      likeBack: (profileId) => {
        const { matches, chats, profiles, me, likedYou } = get();
        const existing = matches.find((m) => m.profileId === profileId);
        if (existing) return { matchId: existing.id };
        const profile = profiles.find((p) => p.id === profileId);
        if (!profile) return {};
        const match: Match = {
          id: makeId("match"),
          profileId,
          matchedAt: new Date().toISOString(),
          compatibility: compatibility(me, profile),
          icebreakers: suggestIcebreakers(me, profile),
          unread: 0
        };
        set({
          matches: [match, ...matches],
          chats: { ...chats, [match.id]: [] },
          likedYou: likedYou.filter((id) => id !== profileId)
        });
        return { matchId: match.id };
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
        boostUntil: s.boostUntil,
        dailyLikesUsed: s.dailyLikesUsed,
        dailyLikesDate: s.dailyLikesDate
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
