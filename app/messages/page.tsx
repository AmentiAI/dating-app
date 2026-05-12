"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AdCard } from "@/components/app/AdCard";
import { BottomNav } from "@/components/app/BottomNav";
import { MOCK_PROFILES } from "@/lib/mockData";
import { useStore } from "@/lib/store";

export default function MessagesPage() {
  const matches = useStore((s) => s.matches);
  const chats = useStore((s) => s.chats);
  const me = useStore((s) => s.me);

  const rows = useMemo(
    () =>
      matches.map((m) => {
        const profile = MOCK_PROFILES.find((p) => p.id === m.profileId);
        const thread = chats[m.id] ?? [];
        const last = thread[thread.length - 1];
        return { matchId: m.id, profile, unread: m.unread, last };
      }),
    [matches, chats]
  );

  return (
    <main className="min-h-screen bg-bg px-4 pb-28 pt-4 text-ink sm:pt-5">
      <header className="mx-auto w-full max-w-xl">
        <h1 className="font-display text-2xl font-semibold">Messages</h1>
      </header>

      <section className="mx-auto mt-4 max-w-xl space-y-3 sm:mt-6">
        {me.plan === "explorer" && <AdCard compact />}
        {rows.length === 0 ? (
          <p className="card p-7 text-base text-sub">No conversations yet. Start matching in Discover.</p>
        ) : (
          rows.map((row) => (
            <Link
              key={row.matchId}
              href={`/chat/${row.matchId}`}
              className="card flex items-center justify-between p-5 transition hover:border-accent2/40"
            >
              <div>
                <p className="text-lg font-semibold">{row.profile?.name ?? "Conversation"}</p>
                <p className="line-clamp-1 text-sm text-sub">{row.last?.text ?? "Say hi to start chatting."}</p>
              </div>
              <span className="text-xs font-semibold text-accent2">
                {row.unread > 0 ? `${row.unread} new` : "Open"}
              </span>
            </Link>
          ))
        )}
      </section>

      <BottomNav />
    </main>
  );
}
