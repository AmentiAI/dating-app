"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdCard } from "@/components/app/AdCard";
import { BottomNav } from "@/components/app/BottomNav";
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
  const router = useRouter();
  const me = useStore((s) => s.me);
  const matches = useStore((s) => s.matches);
  const dailyLikesUsed = useStore((s) => s.dailyLikesUsed);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "auth">("loading");
  const [deck, setDeck] = useState<Profile[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const authRes = await fetch("/api/auth/me", { cache: "no-store", signal: ac.signal });
        const authJson = (await authRes.json()) as {
          user?: { id: string; plan: string; onboarded?: boolean } | null;
        };
        if (!authJson?.user) {
          if (!ac.signal.aborted) setStatus("auth");
          return;
        }
        if (authJson.user.onboarded !== true) {
          if (!ac.signal.aborted) router.replace("/onboarding");
          return;
        }
        const plan = authJson.user.plan;
        const validPlan = plan === "plus" || plan === "premium" || plan === "elite" ? plan : "explorer";
        useStore.getState().updateMe({
          id: authJson.user.id,
          plan: validPlan,
          premium: validPlan !== "explorer"
        });
        const res = await fetch("/api/discover", { cache: "no-store", signal: ac.signal });
        if (res.status === 401) {
          if (!ac.signal.aborted) router.push("/login?next=/discover");
          return;
        }
        if (res.status === 403) {
          let payload: { needsOnboarding?: boolean } = {};
          try {
            payload = (await res.json()) as { needsOnboarding?: boolean };
          } catch {
            /* ignore */
          }
          if (payload.needsOnboarding && !ac.signal.aborted) {
            router.replace("/onboarding");
            return;
          }
          if (!ac.signal.aborted) {
            setNotice("Could not load people to discover.");
            setDeck([]);
            setStatus("ready");
          }
          return;
        }
        if (!res.ok) {
          if (!ac.signal.aborted) {
            setNotice("Could not load people to discover.");
            setDeck([]);
            setStatus("ready");
          }
          return;
        }
        const data = (await res.json()) as { profiles?: Profile[] };
        if (ac.signal.aborted) return;
        setDeck(data.profiles ?? []);
        setStatus("ready");
      } catch {
        if (!ac.signal.aborted) {
          setNotice("Could not load discover.");
          setDeck([]);
          setStatus("ready");
        }
      }
    })();
    return () => ac.abort();
  }, [router]);

  const current = useMemo(() => deck[0], [deck]);

  const swipeDb = useCallback(
    async (decision: "like" | "pass" | "superlike") => {
      if (!current || status !== "ready") return;
      setNotice(null);
      const res = await fetch("/api/swipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swipedUserId: current.id, type: decision })
      });
      let json: {
        error?: string;
        duplicate?: boolean;
        matched?: boolean;
        matchId?: string;
        compatibility?: number;
        needsOnboarding?: boolean;
      } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        setNotice("Swipe failed.");
        return;
      }
      if (res.status === 403 && json.needsOnboarding) {
        router.replace("/onboarding");
        return;
      }
      if (!res.ok) {
        setNotice(typeof json.error === "string" ? json.error : "Swipe failed.");
        return;
      }
      setDeck((prev) => prev.filter((p) => p.id !== current.id));
      if (json.duplicate) return;
      if (json.matched && json.matchId) {
        useStore.getState().addRealMatch({
          matchId: json.matchId,
          profile: current,
          compatibility: typeof json.compatibility === "number" ? json.compatibility : 85
        });
      }
      if (decision !== "pass" && me.plan === "explorer") {
        useStore.getState().bumpDailyLikeIfExplorer();
      }
    },
    [current, status, me.plan, router]
  );

  const refetchDiscover = useCallback(async () => {
    setNotice(null);
    const authRes = await fetch("/api/auth/me", { cache: "no-store" });
    const authJson = (await authRes.json()) as { user?: { onboarded?: boolean } | null };
    if (!authJson?.user) {
      router.push("/login?next=/discover");
      return;
    }
    if (authJson.user.onboarded !== true) {
      router.replace("/onboarding");
      return;
    }
    const res = await fetch("/api/discover", { cache: "no-store" });
    if (res.status === 401) {
      router.push("/login?next=/discover");
      return;
    }
    if (res.status === 403) {
      let payload: { needsOnboarding?: boolean } = {};
      try {
        payload = (await res.json()) as { needsOnboarding?: boolean };
      } catch {
        /* ignore */
      }
      if (payload.needsOnboarding) {
        router.replace("/onboarding");
        return;
      }
      setNotice("Could not refresh deck.");
      return;
    }
    if (!res.ok) {
      setNotice("Could not refresh deck.");
      return;
    }
    const data = (await res.json()) as { profiles?: Profile[] };
    setDeck(data.profiles ?? []);
  }, [router]);

  return (
    <div className="min-h-screen bg-bg pb-28 pt-4 text-ink aurora sm:pt-6">
      <header className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 sm:px-5">
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
          href="/messages"
          className="rounded-full border border-line/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-accent2 sm:text-sm"
        >
          Messages ({matches.length})
        </Link>
      </header>

      <div className="mx-auto mt-5 max-w-lg px-4 sm:mt-6 sm:px-5">
        {status === "auth" && (
          <div className="card p-8 text-center">
            <p className="font-display text-xl font-semibold">Sign in to discover</p>
            <p className="mt-2 text-sm text-sub">Create an account or log in to see real people on Preference Plus.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/login?next=/discover" className="pill-grad text-center">
                Log in
              </Link>
              <Link href="/signup" className="btn-ghost text-center">
                Create account
              </Link>
            </div>
          </div>
        )}

        {status !== "auth" && (
          <>
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
                <span className="chip text-[11px] text-sub">Race {me.filters.preferredRaces.join(", ")}</span>
              )}
              {me.plan === "explorer" && (
                <span className="chip text-[11px] text-sub">Likes left today {Math.max(0, 10 - dailyLikesUsed)}</span>
              )}
            </div>
            {me.plan === "explorer" && (
              <div className="mb-4">
                <AdCard compact />
              </div>
            )}
            {status === "loading" && (
              <div className="card p-10 text-center text-sm text-sub">Loading people near you…</div>
            )}
            {status === "ready" && notice && (
              <p className="mb-3 rounded-xl border border-gold/50 bg-gold/10 px-3 py-2 text-sm text-ink">{notice}</p>
            )}
            {status === "ready" && !current ? (
              <div className="card p-8 text-center">
                <p className="font-display text-xl font-semibold">You&apos;re caught up</p>
                <p className="mt-2 text-sm text-sub">
                  Check back later for new people, or refresh. Widen filters in your profile if the pool feels small.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <button type="button" className="pill-grad" onClick={() => void refetchDiscover()}>
                    Refresh deck
                  </button>
                  <Link href="/profile" className="btn-ghost text-center text-sm">
                    Edit profile & filters
                  </Link>
                </div>
              </div>
            ) : null}
            {status === "ready" && current ? (
              <article className="card overflow-hidden">
                <div className="relative aspect-[4/5] w-full bg-surface2">
                  {pickPhoto(current) ? (
                    <Image
                      src={pickPhoto(current)!}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw, 420px"
                      priority
                      unoptimized
                    />
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
                <div className="space-y-4 p-5 sm:p-6">
                  <p className="text-sm font-medium uppercase tracking-wide text-muted">Compatibility preview</p>
                  <ul className="space-y-2.5 text-base text-sub">
                    <li className="flex gap-2">
                      <span className="text-accent3">●</span> Shared signals on intent & lifestyle
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent2">●</span> Mutual interest overlap
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent">●</span> Your filters shape who appears here
                    </li>
                  </ul>
                  <div className="flex gap-2 pt-2 sm:gap-3">
                    <button type="button" className="btn-ghost flex-1 py-3.5" onClick={() => void swipeDb("pass")}>
                      Pass
                    </button>
                    <button
                      type="button"
                      className="flex-[1.2] rounded-full border border-white/10 bg-white/10 px-3 py-3.5 text-base font-semibold text-white hover:bg-white/15"
                      onClick={() => void swipeDb("like")}
                    >
                      Like
                    </button>
                    <button type="button" className="pill-grad flex-1 px-3 py-3.5 text-base" onClick={() => void swipeDb("superlike")}>
                      Super
                    </button>
                  </div>
                </div>
              </article>
            ) : null}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
