"use client";

import Link from "next/link";
import { BottomNav } from "@/components/app/BottomNav";
import { useStore } from "@/lib/store";
import { MOCK_PROFILES } from "@/lib/mockData";

export default function MatchesPage() {
  const matches = useStore((s) => s.matches);

  return (
    <div className="min-h-screen bg-bg px-4 pb-20 pt-5 text-ink sm:px-5 sm:pb-16 sm:pt-8">
      <header className="mx-auto flex max-w-md items-center justify-between">
        <Link href="/discover" className="text-sm text-sub hover:text-ink">
          ← Discover
        </Link>
        <p className="font-display text-lg font-semibold">Matches</p>
        <span className="w-10" />
      </header>

      <div className="mx-auto mt-6 max-w-lg space-y-4 sm:mt-8">
        {matches.length === 0 ? (
          <p className="rounded-3xl border border-line/60 bg-surface p-7 text-base text-sub">
            No matches yet. Like profiles in Discover — matches appear when compatibility and mutual interest align.
          </p>
        ) : (
          matches.map((m) => {
            const p = MOCK_PROFILES.find((x) => x.id === m.profileId);
            return (
              <Link
                key={m.id}
                href={`/chat/${m.id}`}
                className="flex items-center justify-between rounded-3xl border border-line/60 bg-surface px-5 py-5 transition hover:border-accent2/40 active:scale-[0.99]"
              >
                <div>
                  <p className="text-lg font-medium">{p?.name ?? "Match"}</p>
                  <p className="text-sm text-muted">{m.compatibility}% compatibility</p>
                </div>
                <span className="text-sm font-semibold text-accent2">
                  {m.unread ? `${m.unread} new` : "Open"}
                </span>
              </Link>
            );
          })
        )}
      </div>
      <BottomNav />
    </div>
  );
}
