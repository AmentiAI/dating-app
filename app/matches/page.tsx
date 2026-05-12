"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { BottomNav } from "@/components/app/BottomNav";
import { MOCK_PROFILES } from "@/lib/mockData";
import { useStore } from "@/lib/store";
import type { Match } from "@/lib/types";

function displayName(m: Match): string {
  const mock = MOCK_PROFILES.find((x) => x.id === m.profileId);
  return mock?.name ?? m.otherName ?? "Match";
}

function displayPhoto(m: Match): string | null {
  const mock = MOCK_PROFILES.find((x) => x.id === m.profileId);
  const fromMock = mock?.media.find((x) => x.kind === "photo")?.url;
  return fromMock ?? m.otherPhotoUrl ?? null;
}

export default function MatchesPage() {
  const matches = useStore((s) => s.matches);

  const sorted = useMemo(
    () => [...matches].sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()),
    [matches]
  );

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
        {sorted.length === 0 ? (
          <p className="rounded-3xl border border-line/60 bg-surface p-7 text-base text-sub">
            No matches yet. Like profiles in Discover — matches appear when compatibility and mutual interest align.
          </p>
        ) : (
          sorted.map((m) => {
            const name = displayName(m);
            const photo = displayPhoto(m);
            return (
              <Link
                key={m.id}
                href={`/chat/${m.id}`}
                className="flex items-center justify-between gap-3 rounded-3xl border border-line/60 bg-surface px-4 py-4 transition hover:border-accent2/40 active:scale-[0.99] sm:px-5 sm:py-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-surface2">
                    {photo ? (
                      <Image src={photo} alt="" fill className="object-cover" sizes="56px" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted">No photo</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium">{name}</p>
                    <p className="text-sm text-muted">{m.compatibility}% compatibility</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-accent2">
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
