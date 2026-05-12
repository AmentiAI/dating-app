"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Filters, Match, Me, Moment, Profile } from "./types";
import { isDbMatchId } from "./matchIds";
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
  sendMessage: (matchId: string, msg: Omit<ChatMessage, "id" | "ts">) => void | Promise<void>;
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
  /** DB discover: record swipe locally (no mock match logic). */
  recordDiscoverSwipe: (profileId: string, decision: Decision) => void;
  /** Server-confirmed mutual match (real UUID match id). */
  addRealMatch: (args: { matchId: string; profile: Profile; compatibility: number }) => void;
  /** After a successful API like/superlike while on Explorer — keeps UI counter in sync with server. */
  bumpDailyLikeIfExplorer: () => void;
  /** Merge / upsert matches from GET /api/matches; keeps local unread and icebreakers when present. */
  mergeMatchesFromApi: (incoming: Match[]) => void;
  /** Replace thread with server messages when non-empty; keeps local (e.g. AI tips) when server has none. */
  hydrateChatFromServer: (matchId: string, serverMsgs: ChatMessage[]) => void;
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

      sendMessage: async (matchId, partial) => {
        const { chats, matches, typingByMatch } = get();
        const list = chats[matchId] ?? [];

        if (isDbMatchId(matchId) && partial.role === "me") {
          const text = (partial.text ?? "").trim();
          if (!text) return;
          const res = await fetch(`/api/matches/${matchId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
          });
          if (!res.ok) return;
          const data = (await res.json()) as { message?: ChatMessage };
          if (!data.message) return;
          const curr = get().chats[matchId] ?? [];
          set({
            chats: { ...get().chats, [matchId]: [...curr, data.message] }
          });
          return;
        }

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
      },

      recordDiscoverSwipe: (profileId, decision) => {
        set({ decisions: { ...get().decisions, [profileId]: decision } });
      },

      addRealMatch: ({ matchId, profile, compatibility: score }) => {
        const { matches, chats, me } = get();
        if (matches.some((m) => m.id === matchId)) return;
        const firstPhoto = profile.media.find((m) => m.kind === "photo")?.url ?? null;
        const match: Match = {
          id: matchId,
          profileId: profile.id,
          matchedAt: new Date().toISOString(),
          compatibility: score,
          icebreakers: suggestIcebreakers(me, profile),
          unread: 1,
          otherName: profile.name,
          otherAge: profile.age,
          otherPhotoUrl: firstPhoto
        };
        const firstMsg: ChatMessage = {
          id: makeId("msg"),
          role: "ai",
          text: `You matched with ${profile.name}. Here are 3 openers tuned to their profile.`,
          ts: new Date().toISOString()
        };
        set({
          matches: [match, ...matches],
          chats: { ...chats, [matchId]: [firstMsg] }
        });
      },

      bumpDailyLikeIfExplorer: () => {
        const { me, dailyLikesUsed, dailyLikesDate } = get();
        if (me.plan !== "explorer") return;
        const today = todayKey();
        let likesUsed = dailyLikesUsed;
        if (dailyLikesDate !== today) likesUsed = 0;
        set({ dailyLikesUsed: likesUsed + 1, dailyLikesDate: today });
      },

      mergeMatchesFromApi: (incoming) => {
        const { matches, chats } = get();
        const prevById = new Map(matches.map((m) => [m.id, m]));
        const incIds = new Set(incoming.map((m) => m.id));
        const mergedIncoming = incoming.map((m) => {
          const prev = prevById.get(m.id);
          if (!prev) return m;
          return {
            ...m,
            unread: Math.max(m.unread, prev.unread),
            icebreakers: prev.icebreakers.length ? prev.icebreakers : m.icebreakers
          };
        });
        const rest = matches.filter((m) => !incIds.has(m.id));
        const nextMatches = [...mergedIncoming, ...rest].sort(
          (a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
        );

        const nextChats = { ...chats };
        for (const m of mergedIncoming) {
          if (isDbMatchId(m.id)) continue;
          const existing = chats[m.id];
          if (existing && existing.length > 0) continue;
          const name = m.otherName ?? "your match";
          const text =
            m.icebreakers.length > 0
              ? `You matched with ${name}. Try: ${m.icebreakers[0]}`
              : `You matched with ${name}. Say hi when you're ready.`;
          nextChats[m.id] = [
            {
              id: makeId("msg"),
              role: "ai",
              text,
              ts: new Date().toISOString()
            }
          ];
        }

        set({ matches: nextMatches, chats: nextChats });
      },

      hydrateChatFromServer: (matchId, serverMsgs) => {
        if (!isDbMatchId(matchId)) return;
        const prev = get().chats[matchId] ?? [];
        if (serverMsgs.length === 0) return;
        const ai = prev.filter((m) => m.role === "ai");
        const next = [...ai, ...serverMsgs].sort(
          (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
        );
        set({ chats: { ...get().chats, [matchId]: next } });
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
