"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MOCK_PROFILES } from "@/lib/mockData";
import { isDbMatchId } from "@/lib/matchIds";
import { useStore } from "@/lib/store";

export default function ChatPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const matches = useStore((s) => s.matches);
  const chats = useStore((s) => s.chats);
  const sendMessage = useStore((s) => s.sendMessage);
  const markMatchRead = useStore((s) => s.markMatchRead);
  const hydrateChatFromServer = useStore((s) => s.hydrateChatFromServer);
  const typing = useStore((s) => s.typingByMatch[matchId] ?? false);
  const me = useStore((s) => s.me);

  const match = useMemo(() => matches.find((m) => m.id === matchId), [matches, matchId]);
  const profile = useMemo(
    () => MOCK_PROFILES.find((p) => p.id === match?.profileId),
    [match?.profileId]
  );
  const displayName = profile?.name ?? match?.otherName ?? "Chat";
  const thread = chats[matchId] ?? [];
  const [text, setText] = useState("");
  const hasReplyAfterLastMe = useMemo(() => {
    const lastMeIndex = thread.map((m) => m.role).lastIndexOf("me");
    if (lastMeIndex < 0) return false;
    return thread.slice(lastMeIndex + 1).some((m) => m.role === "them");
  }, [thread]);

  useEffect(() => {
    markMatchRead(matchId);
  }, [markMatchRead, matchId]);

  useEffect(() => {
    if (!match || !isDbMatchId(matchId)) return;
    const ac = new AbortController();
    (async () => {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        cache: "no-store",
        signal: ac.signal
      });
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
  }, [match, matchId, hydrateChatFromServer]);

  if (!match) {
    return (
      <div className="min-h-screen bg-bg px-5 py-16 text-ink">
        <p className="text-sm text-sub">Match not found.</p>
        <Link href="/messages" className="mt-4 inline-block text-sm text-accent2">
          ← Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="sticky top-0 z-10 border-b border-line/60 bg-bg/90 px-4 py-4 backdrop-blur-xl sm:px-5">
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

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5">
        {thread.map((m) => (
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
        ))}
        {typing && <p className="text-xs text-muted">Typing...</p>}
        {me.plan !== "explorer" && hasReplyAfterLastMe && (
          <p className="text-right text-xs text-muted">Seen</p>
        )}
      </div>

      <form
        className="safe-bottom sticky bottom-0 border-t border-line/60 bg-bg/95 px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const t = text.trim();
          if (!t) return;
          await sendMessage(matchId, { role: "me", text: t });
          setText("");
        }}
      >
        <div className="mx-auto flex max-w-xl gap-2">
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
      </form>
    </div>
  );
}
