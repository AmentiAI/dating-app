"use client";

import { BottomNav } from "@/components/app/BottomNav";
import { OneTimeGrid } from "@/components/premium/OneTimeCards";
import { TierGrid, type TierId } from "@/components/premium/TierCard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { Match } from "@/lib/types";

export default function PremiumPage() {
  const router = useRouter();
  const me = useStore((s) => s.me);
  const setPlan = useStore((s) => s.setPlan);
  const addBoostCredits = useStore((s) => s.addBoostCredits);
  const [sessionOk, setSessionOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      if (!res?.ok || cancelled) return;
      const data = (await res.json()) as { user: { onboarded?: boolean } | null };
      if (cancelled) return;
      if (!data.user) {
        router.replace("/login?next=/premium");
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

  async function choosePlan(plan: TierId) {
    const res = await fetch("/api/billing/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    }).catch(() => null);
    if (res?.status === 401) {
      router.replace("/login?next=/premium");
      return;
    }
    if (res?.status === 403) {
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
    }
    if (!res?.ok) return;
    setPlan(plan);
    if (plan !== "explorer") {
      const mRes = await fetch("/api/matches", { cache: "no-store" }).catch(() => null);
      if (mRes?.ok) {
        const mData = (await mRes.json()) as { matches?: Match[] };
        useStore.getState().mergeMatchesFromApi(mData.matches ?? []);
      }
    }
  }

  async function buyItem(label: string, price: string, boosts: number) {
    if (boosts > 0) addBoostCredits(boosts);
    const amountCents = Math.round(Number(price.replace(/[^0-9.]/g, "")) * 100);
    const res = await fetch("/api/billing/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemKey: label.toLowerCase().replace(/\s+/g, "_"), amountCents })
    }).catch(() => null);
    if (res?.status === 401) {
      router.replace("/login?next=/premium");
      return;
    }
    if (res?.status === 403) {
      let payload: { needsOnboarding?: boolean } = {};
      try {
        payload = (await res.json()) as { needsOnboarding?: boolean };
      } catch {
        /* ignore */
      }
      if (payload.needsOnboarding) router.replace("/onboarding");
    }
  }

  if (!sessionOk) {
    return (
      <main className="min-h-screen bg-bg px-4 pb-28 pt-8 text-ink">
        <p className="mx-auto max-w-xl text-center text-sm text-sub">Loading…</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg px-4 pb-28 pt-4 text-ink sm:pt-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-grad-aurora opacity-50 blur-3xl" aria-hidden />

      <header className="relative mx-auto w-full max-w-xl">
        <div className="flex items-center gap-2">
          <svg className="h-8 w-8 shrink-0 text-accent2" viewBox="0 0 32 32" fill="none" aria-hidden>
            <path
              d="M6 26V10l10-6 10 6v16l-10 4-10-4Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
              className="fill-accent/15"
            />
            <path d="M16 8v16M10 12l6-3 6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
          </svg>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Packages & Purchases</h1>
            <p className="mt-1 text-sm text-sub">
              Current plan: <span className="font-semibold capitalize text-ink">{me.plan}</span> · Boosts:{" "}
              {me.boostCredits}
            </p>
          </div>
        </div>
      </header>

      <TierGrid me={me} onChoose={choosePlan} />

      <OneTimeGrid onBuy={buyItem} />

      <BottomNav />
    </main>
  );
}
