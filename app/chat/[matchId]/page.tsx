"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BottomNav } from "@/components/app/BottomNav";
import { isDbMatchId } from "@/lib/matchIds";
import { useStore } from "@/lib/store";
import type { Match } from "@/lib/types";

export default function ChatPage() {
  const params = useParams<{ matchId: string }>();
  const router = useRouter();
  const matchId = params.matchId;
  const matches = useStore((s) => s.matches);
  const chats = useStore((s) => s.chats);
  const sendMessage = useStore((s) => s.sendMessage);
  const markMatchRead = useStore((s) => s.markMatchRead);
  const hydrateChatFromServer = useStore((s) => s.hydrateChatFromServer);
  const mergeMatchesFromApi = useStore((s) => s.mergeMatchesFromApi);
  const removeMatchByMatchId = useStore((s) => s.removeMatchByMatchId);
  const me = useStore((s) => s.me);

  const [sessionReady, setSessionReady] = useState(false);
  const [listsReady, setListsReady] = useState(false);
  const [conversationClosed, setConversationClosed] = useState(false);
  const matchListFetchFor = useRef<string | null>(null);

  useEffect(() => {
    setListsReady(false);
    matchListFetchFor.current = null;
    setSendError(null);
    setConversationClosed(false);
  }, [matchId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      if (!res?.ok || cancelled) return;
      const data = (await res.json()) as { user: { onboarded?: boolean } | null };
      if (cancelled) return;
      if (!data.user) {
        const next = encodeURIComponent(`/chat/${matchId}`);
        router.replace(`/login?next=${next}`);
        return;
      }
      if (data.user.onboarded !== true) {
        router.replace("/onboarding");
        return;
      }
      setSessionReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, matchId]);

  useEffect(() => {
    if (!sessionReady) return;
    if (!isDbMatchId(matchId)) {
      setListsReady(true);
      return;
    }
    if (matches.some((m) => m.id === matchId)) {
      setListsReady(true);
      return;
    }
    if (matchListFetchFor.current === matchId) {
      setListsReady(true);
      return;
    }
    matchListFetchFor.current = matchId;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/matches", { cache: "no-store" }).catch(() => null);
      if (res?.status === 403) {
        let payload: { needsOnboarding?: boolean } = {};
        try {
          payload = (await res.json()) as { needsOnboarding?: boolean };
        } catch {
          /* ignore */
        }
        if (!cancelled && payload.needsOnboarding) {
          router.replace("/onboarding");
          return;
        }
      }
      if (!res?.ok || cancelled) {
        if (!cancelled) setListsReady(true);
        return;
      }
      const body = (await res.json()) as { matches?: Match[] };
      if (cancelled) return;
      mergeMatchesFromApi(body.matches ?? []);
      setListsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionReady, matchId, matches, mergeMatchesFromApi, router]);

  const match = useMemo(() => matches.find((m) => m.id === matchId), [matches, matchId]);
  const displayName = match?.otherName ?? "Chat";
  const thread = chats[matchId] ?? [];
  const [text, setText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const hasReplyAfterLastMe = useMemo(() => {
    const lastMeIndex = thread.map((m) => m.role).lastIndexOf("me");
    if (lastMeIndex < 0) return false;
    return thread.slice(lastMeIndex + 1).some((m) => m.role === "them");
  }, [thread]);

  useEffect(() => {
    if (!sessionReady || !match) return;
    markMatchRead(matchId);
  }, [markMatchRead, matchId, sessionReady, match]);

  useEffect(() => {
    if (!sessionReady || !match || !isDbMatchId(matchId)) return;
    const ac = new AbortController();
    (async () => {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        cache: "no-store",
        signal: ac.signal
      });
      if (res.status === 403) {
        let payload: { needsOnboarding?: boolean; code?: string } = {};
        try {
          payload = (await res.json()) as { needsOnboarding?: boolean; code?: string };
        } catch {
          /* ignore */
        }
        if (!ac.signal.aborted) {
          if (payload.needsOnboarding) {
            router.replace("/onboarding");
            return;
          }
          if (payload.code === "blocked") {
            removeMatchByMatchId(matchId);
            setConversationClosed(true);
            return;
          }
        }
        return;
      }
      if (res.status === 404) {
        if (!ac.signal.aborted) {
          removeMatchByMatchId(matchId);
          setConversationClosed(true);
        }
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: { id: string; role: string; text?: string; ts: string }[] };
      if (ac.signal.aborted) return;
      const raw = data.messages ?? [];
      const messages = raw.map((m) => ({
        id: m.id,
        role: m.role as "me" | "them" | "ai",
        text: m.text,
        ts: m.ts
      }));
      hydrateChatFromServer(matchId, messages);
    })();
    return () => ac.abort();
  }, [match, matchId, hydrateChatFromServer, sessionReady, router, removeMatchByMatchId]);

  if (!sessionReady || !listsReady) {
    return (
      <div className="flex min-h-screen flex-col bg-bg pb-28 text-ink">
        <div className="flex flex-1 items-center justify-center px-5 py-16">
          <p className="text-sm text-sub">Loading…</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (conversationClosed) {
    return (
      <div className="flex min-h-screen flex-col bg-bg pb-28 text-ink">
        <div className="flex flex-1 flex-col justify-center px-5 py-16">
          <p className="font-display text-lg font-semibold">Conversation unavailable</p>
          <p className="mt-2 text-sm text-sub">
            This thread is closed, often because someone blocked the other or the match was removed.
          </p>
          <Link href="/messages" className="mt-5 inline-block text-sm font-semibold text-accent2">
            ← Back to messages
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-screen flex-col bg-bg pb-28 text-ink">
        <div className="flex flex-1 flex-col justify-center px-5 py-16">
          <p className="text-sm text-sub">Match not found.</p>
          <Link href="/messages" className="mt-4 inline-block text-sm text-accent2">
            ← Back to messages
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg pb-28 text-ink">
      <header className="sticky top-0 z-10 shrink-0 border-b border-line/60 bg-bg/90 px-4 py-4 backdrop-blur-xl sm:px-5">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link href="/messages" className="text-sm text-sub">
            ←
          </Link>
          <div>
            <p className="font-semibold">{displayName}</p>
            <p className="text-xs text-muted">{match.compatibility}% compatibility</p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5">
        {thread.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-base font-medium text-ink">Start the conversation</p>
            <p className="max-w-xs text-sm text-sub">Say hi to {displayName} — your first message goes straight to them.</p>
          </div>
        ) : (
          thread.map((m) => (
            <div
              key={m.id}
              className={`max-w-[88%] rounded-2xl px-5 py-3.5 text-base leading-relaxed ${
                m.role === "me"
                  ? "ml-auto bg-gradient-to-br from-accent/90 to-accent2/90 text-white"
                  : m.role === "ai"
                    ? "border border-line/60 bg-surface text-sub"
                    : "border border-line/60 bg-surface2 text-ink"
              }`}
            >
              {m.text}
            </div>
          ))
        )}
        {me.plan !== "explorer" && hasReplyAfterLastMe && (
          <p className="text-right text-xs text-muted">Seen</p>
        )}
      </div>

      <form
        className="safe-bottom shrink-0 border-t border-line/60 bg-bg/95 px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const t = text.trim();
          if (!t) return;
          setSendError(null);
          const ok = await sendMessage(matchId, { role: "me", text: t });
          if (ok) setText("");
          else setSendError("Could not send. Check your connection and try again.");
        }}
      >
        <div className="mx-auto flex max-w-xl flex-col gap-2">
          {sendError && <p className="text-center text-sm text-red-700">{sendError}</p>}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message…"
              className="flex-1 rounded-2xl border border-line bg-surface px-4 py-3.5 text-base text-ink outline-none ring-accent2/30 focus:ring-2"
            />
            <button type="submit" className="pill-grad px-6 py-3.5 text-base">
              Send
            </button>
          </div>
        </div>
      </form>

      <BottomNav />
    </div>
  );
}
