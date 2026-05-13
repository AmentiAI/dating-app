"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Filters, Match, Me, Profile } from "./types";
import { isDbMatchId } from "./matchIds";
import { suggestIcebreakers } from "./aiMatcher";

type State = {
  me: Me;
  matches: Match[];
  chats: Record<string, ChatMessage[]>;
  boostUntil?: string;
  dailyLikesUsed: number;
  dailyLikesDate: string;

  sendMessage: (matchId: string, msg: Omit<ChatMessage, "id" | "ts">) => boolean | Promise<boolean>;
  reactToMessage: (matchId: string, msgId: string, reaction: string) => void;
  updateMe: (patch: Partial<Me>) => void;
  updateFilters: (patch: Partial<Filters>) => void;
  setPlan: (plan: Me["plan"]) => void;
  addBoostCredits: (count: number) => void;
  startBoost: (mins: number) => void;
  markMatchRead: (matchId: string) => void;
  addRealMatch: (args: { matchId: string; profile: Profile; compatibility: number }) => void;
  bumpDailyLikeIfExplorer: () => void;
  mergeMatchesFromApi: (incoming: Match[]) => void;
  hydrateChatFromServer: (matchId: string, serverMsgs: ChatMessage[]) => void;
  /** Clear persisted client state after logout (matches, chats, me, etc.). */
  resetForLogout: () => void;
};

const defaultMe: Me = {
  id: "",
  name: "",
  age: 18,
  pronouns: "they/them",
  orientation: "bisexual",
  city: "",
  intent: "open-to-anything",
  bio: "",
  vibes: [],
  interests: [],
  prompts: [
    { q: "About me", a: "" },
    { q: "I'm looking for", a: "" },
    { q: "On a perfect day", a: "" }
  ],
  media: [],
  personality: { open: 0.5, warm: 0.5, driven: 0.5, playful: 0.5, grounded: 0.5 },
  filters: {
    ageRange: [18, 80],
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
  dealbreakers: [],
  onboarded: false
};

function freshDefaultMe(): Me {
  return {
    ...defaultMe,
    filters: {
      ...defaultMe.filters,
      intents: [...defaultMe.filters.intents],
      vibes: [...defaultMe.filters.vibes],
      preferredRaces: [...(defaultMe.filters.preferredRaces ?? [])]
    },
    prompts: defaultMe.prompts.map((p) => ({ ...p })),
    personality: { ...defaultMe.personality },
    interests: [],
    vibes: [],
    media: [],
    dealbreakers: []
  };
}

function makeId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export const useStore = create<State>()(
  persist(
      (set, get) => ({
      me: freshDefaultMe(),
      matches: [],
      chats: {},
      dailyLikesUsed: 0,
      dailyLikesDate: todayKey(),

      sendMessage: async (matchId, partial) => {
        const { chats } = get();
        const list = chats[matchId] ?? [];

        if (isDbMatchId(matchId) && partial.role === "me") {
          const text = (partial.text ?? "").trim();
          if (!text) return false;
          const res = await fetch(`/api/matches/${matchId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
          });
          if (!res.ok) return false;
          const data = (await res.json()) as { message?: ChatMessage };
          if (!data.message) return false;
          const curr = get().chats[matchId] ?? [];
          set({
            chats: { ...get().chats, [matchId]: [...curr, data.message] }
          });
          return true;
        }

        const msg: ChatMessage = { ...partial, id: makeId("msg"), ts: new Date().toISOString() };
        set({ chats: { ...chats, [matchId]: [...list, msg] } });
        return true;
      },

      reactToMessage: (matchId, msgId, reaction) => {
        const { chats } = get();
        const thread = chats[matchId] ?? [];
        set({
          chats: {
            ...chats,
            [matchId]: thread.map((m) => (m.id === msgId ? { ...m, reaction } : m))
          }
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

      startBoost: (mins) => {
        const until = new Date(Date.now() + mins * 60_000).toISOString();
        set({ boostUntil: until });
      },

      markMatchRead: (matchId) =>
        set({
          matches: get().matches.map((m) => (m.id === matchId ? { ...m, unread: 0 } : m))
        }),

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
        if (isDbMatchId(matchId)) {
          set({
            matches: [match, ...matches],
            chats: { ...chats }
          });
          return;
        }
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
        if (serverMsgs.length === 0) {
          set({ chats: { ...get().chats, [matchId]: [] } });
          return;
        }
        const prev = get().chats[matchId] ?? [];
        const ai = prev.filter((m) => m.role === "ai");
        const next = [...ai, ...serverMsgs].sort(
          (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
        );
        set({ chats: { ...get().chats, [matchId]: next } });
      },

      resetForLogout: () =>
        set({
          me: freshDefaultMe(),
          matches: [],
          chats: {},
          boostUntil: undefined,
          dailyLikesUsed: 0,
          dailyLikesDate: todayKey()
        })
    }),
    {
      name: "preference-plus-store-v2",
      partialize: (s) => ({
        me: s.me,
        matches: s.matches,
        chats: s.chats,
        boostUntil: s.boostUntil,
        dailyLikesUsed: s.dailyLikesUsed,
        dailyLikesDate: s.dailyLikesDate
      })
    }
  )
);
