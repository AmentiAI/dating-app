"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { compatibility } from "@/lib/aiMatcher";
import { useStore } from "@/lib/store";
import type { Profile } from "@/lib/types";

function pickPhoto(p: Profile): string | null {
  const ph = p.media.find((m) => m.kind === "photo");
  return ph?.url ?? null;
}

function formatFeetInches(totalInches: number): string {
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return `${ft}'${inch}"`;
}

export default function DiscoverPage() {
  const me = useStore((s) => s.me);
  const profiles = useStore((s) => s.profiles);
  const decisions = useStore((s) => s.decisions);
  const decide = useStore((s) => s.decide);
  const matches = useStore((s) => s.matches);

  const deck = useMemo(() => {
    return profiles.filter((p) => {
      if (decisions[p.id]) return false;
      const score = compatibility(me, p);
      if (score < 68) return false;
      if (p.age < me.filters.ageRange[0] || p.age > me.filters.ageRange[1]) return false;
      const hr = me.filters.heightRange;
      if (hr && typeof p.height_in === "number") {
        if (p.height_in < hr[0] || p.height_in > hr[1]) return false;
      }
      const wr = me.filters.weightRange;
      if (wr && typeof p.weight_lb === "number") {
        if (p.weight_lb < wr[0] || p.weight_lb > wr[1]) return false;
      }
      const racePref = me.filters.preferredRaces ?? [];
      if (racePref.length > 0 && p.race && !racePref.includes(p.race)) return false;
      return true;
    });
  }, [profiles, decisions, me]);

  const current = deck[0];

  return (
    <div className="min-h-screen bg-bg pb-28 pt-4 text-ink aurora sm:pt-6">
      <header className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 sm:px-5">
        <Link href="/" className="text-sm text-sub hover:text-ink">
          ← Home
        </Link>
        <div className="flex items-center gap-2">
          <Image
            src="/preference-plus-logo.png"
            alt="Preference Plus"
            width={26}
            height={26}
            className="rounded-md border border-line/70 bg-white/70"
          />
          <div className="text-right">
          <p className="text-xs text-muted">Preference Plus</p>
          <p className="text-sm font-semibold">Discover</p>
          </div>
        </div>
        <Link
          href="/matches"
          className="rounded-full border border-line/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-accent2 sm:text-sm"
        >
          Matches ({matches.length})
        </Link>
      </header>

      <div className="mx-auto mt-5 max-w-md px-4 sm:mt-6 sm:px-5">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="chip text-[11px] text-sub">
            Age {me.filters.ageRange[0]}-{me.filters.ageRange[1]}
          </span>
          {me.filters.heightRange && (
            <span className="chip text-[11px] text-sub">
              Height {formatFeetInches(me.filters.heightRange[0])}-{formatFeetInches(me.filters.heightRange[1])}
            </span>
          )}
          {me.filters.weightRange && (
            <span className="chip text-[11px] text-sub">
              Weight {me.filters.weightRange[0]}-{me.filters.weightRange[1]} lb
            </span>
          )}
          {!!me.filters.preferredRaces?.length && (
            <span className="chip text-[11px] text-sub">
              Race {me.filters.preferredRaces.join(", ")}
            </span>
          )}
        </div>
        {!current ? (
          <div className="card p-8 text-center">
            <p className="font-display text-xl font-semibold">You&apos;re caught up</p>
            <p className="mt-2 text-sm text-sub">Reset the deck or tighten filters in onboarding.</p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="pill-grad"
                onClick={() => useStore.getState().resetDeck()}
              >
                Shuffle deck
              </button>
              <Link href="/onboarding" className="btn-ghost text-center text-sm">
                Edit preferences
              </Link>
            </div>
          </div>
        ) : (
          <article className="card overflow-hidden">
            <div className="relative aspect-[4/5] w-full bg-surface2">
              {pickPhoto(current) ? (
                <Image src={pickPhoto(current)!} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 420px" priority />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold sm:text-2xl">
                      {current.name}, {current.age}
                    </p>
                    <p className="text-sm text-white/80">{current.city}</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-right backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-wide text-white/70">Compatibility</p>
                    <p className="text-2xl font-semibold text-white">{compatibility(me, current)}%</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {current.verified && <span className="chip bg-white/10 text-[11px] text-white">Verified</span>}
                  {current.premium && <span className="chip bg-gold/20 text-[11px] text-gold">Premium</span>}
                  <span className="chip bg-white/10 text-[11px] text-white">{current.intent.replace(/-/g, " ")}</span>
                  {current.race && <span className="chip bg-white/10 text-[11px] text-white">{current.race}</span>}
                  {typeof current.height_in === "number" && (
                    <span className="chip bg-white/10 text-[11px] text-white">{formatFeetInches(current.height_in)}</span>
                  )}
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-white/85">{current.headline}</p>
              </div>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Compatibility preview</p>
              <ul className="space-y-2 text-sm text-sub">
                <li className="flex gap-2">
                  <span className="text-accent3">●</span> Shared signals on intent & lifestyle
                </li>
                <li className="flex gap-2">
                  <span className="text-accent2">●</span> Mutual interest overlap (mock)
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">●</span> Weight and race preferences respected in the feed filter
                </li>
              </ul>
              <div className="flex gap-2 pt-2 sm:gap-3">
                <button
                  type="button"
                  className="btn-ghost flex-1 py-3"
                  onClick={() => decide(current.id, "pass")}
                >
                  Pass
                </button>
                <button
                  type="button"
                  className="flex-[1.2] rounded-full border border-white/10 bg-white/10 px-3 py-3 text-sm font-semibold text-white hover:bg-white/15"
                  onClick={() => decide(current.id, "like")}
                >
                  Like
                </button>
                <button
                  type="button"
                  className="pill-grad flex-1 px-3 py-3 text-sm"
                  onClick={() => decide(current.id, "superlike")}
                >
                  Super
                </button>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
