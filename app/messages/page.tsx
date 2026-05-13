"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdCard } from "@/components/app/AdCard";
import { BottomNav } from "@/components/app/BottomNav";
import { useStore } from "@/lib/store";
import type { Match } from "@/lib/types";

function rowTitle(m: Match): string {
  return m.otherName ?? "Conversation";
}

export default function MessagesPage() {
  const router = useRouter();
  const matches = useStore((s) => s.matches);
  const chats = useStore((s) => s.chats);
  const me = useStore((s) => s.me);
  const [sessionOk, setSessionOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      if (!res?.ok || cancelled) return;
      const data = (await res.json()) as { user: { onboarded?: boolean } | null };
      if (cancelled) return;
      if (!data.user) {
        router.replace("/login?next=/messages");
        return;
      }
      if (data.user.onboarded !== true) {
        router.replace("/onboarding");
        return;
      }
      setSessionOk(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const rows = useMemo(
    () =>
      matches.map((m) => {
        const thread = chats[m.id] ?? [];
        const last = thread[thread.length - 1];
        return { matchId: m.id, title: rowTitle(m), unread: m.unread, last };
      }),
    [matches, chats]
  );

  if (!sessionOk) {
    return (
      <main className="min-h-screen bg-bg px-4 pb-28 pt-8 text-ink">
        <p className="mx-auto max-w-xl text-center text-sm text-sub">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-4 pb-28 pt-4 text-ink sm:pt-5">
      <header className="mx-auto w-full max-w-xl">
        <h1 className="font-display text-2xl font-semibold">Messages</h1>
      </header>

      <section className="mx-auto mt-4 max-w-xl space-y-3 sm:mt-6">
        {me.plan === "explorer" && <AdCard compact />}
        {rows.length === 0 ? (
          <div className="card p-7 text-center">
            <p className="text-base text-sub">No conversations yet. When you match, chats show up here.</p>
            <Link href="/discover" className="pill-grad mt-5 inline-flex w-full justify-center sm:w-auto sm:min-w-[200px]">
              Go to Discover
            </Link>
          </div>
        ) : (
          rows.map((row) => (
            <Link
              key={row.matchId}
              href={`/chat/${row.matchId}`}
              className="card flex items-center justify-between p-5 transition hover:border-accent2/40"
            >
              <div>
                <p className="text-lg font-semibold">{row.title}</p>
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
