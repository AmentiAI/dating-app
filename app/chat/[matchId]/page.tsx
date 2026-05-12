"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { MOCK_PROFILES } from "@/lib/mockData";
import { useStore } from "@/lib/store";

export default function ChatPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const matches = useStore((s) => s.matches);
  const chats = useStore((s) => s.chats);
  const sendMessage = useStore((s) => s.sendMessage);

  const match = useMemo(() => matches.find((m) => m.id === matchId), [matches, matchId]);
  const profile = useMemo(
    () => MOCK_PROFILES.find((p) => p.id === match?.profileId),
    [match?.profileId]
  );
  const thread = chats[matchId] ?? [];
  const [text, setText] = useState("");

  if (!match) {
    return (
      <div className="min-h-screen bg-bg px-5 py-16 text-ink">
        <p className="text-sm text-sub">Match not found.</p>
        <Link href="/matches" className="mt-4 inline-block text-sm text-accent2">
          ← Back to matches
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="sticky top-0 z-10 border-b border-line/60 bg-bg/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href="/matches" className="text-sm text-sub">
            ←
          </Link>
          <div>
            <p className="font-semibold">{profile?.name ?? "Chat"}</p>
            <p className="text-xs text-muted">{match.compatibility}% compatibility</p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5">
        {thread.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
      </div>

      <form
        className="safe-bottom sticky bottom-0 border-t border-line/60 bg-bg/95 px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-4"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (!t) return;
          sendMessage(matchId, { role: "me", text: t });
          setText("");
        }}
      >
        <div className="mx-auto flex max-w-lg gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message…"
            className="flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none ring-accent2/30 focus:ring-2"
          />
          <button type="submit" className="pill-grad px-5 py-3 text-sm">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
