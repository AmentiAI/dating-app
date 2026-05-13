"use client";

import { BottomNav } from "@/components/app/BottomNav";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { Match } from "@/lib/types";

const tiers = [
  {
    id: "explorer",
    name: "Explorer",
    price: "$0",
    blurb: "Mass growth tier with real utility",
    features: ["Create profile", "Basic filters", "10 likes/day", "Match + chat", "Limited radius"]
  },
  {
    id: "plus",
    name: "Plus",
    price: "$7.99/mo",
    blurb: "Best value and highest conversion",
    features: [
      "Unlimited likes",
      "No ads",
      "See who liked you",
      "Advanced filters",
      "5 boosts/month",
      "Read receipts"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: "$14.99/mo",
    blurb: "Power user tier",
    features: [
      "Unlimited boosts",
      "AI opener suggestions",
      "Top Picks daily",
      "Profile analytics",
      "Incognito mode"
    ]
  },
  {
    id: "elite",
    name: "Elite",
    price: "$39.99/mo",
    blurb: "Status + concierge tier",
    features: [
      "Elite verified badge",
      "Concierge matchmaking",
      "Priority placement",
      "Elite-only feed",
      "Early feature access"
    ]
  }
] as const;

const oneTime = [
  { label: "1 Boost", price: "$1.99", boosts: 1 },
  { label: "5 Boosts", price: "$6.99", boosts: 5 },
  { label: "Super Like", price: "$0.99", boosts: 0 },
  { label: "Profile Spotlight", price: "$4.99", boosts: 0 },
  { label: "Read receipt pack", price: "$2.99", boosts: 0 },
  { label: "AI opener pack", price: "$3.99", boosts: 0 }
];

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

  async function choosePlan(plan: (typeof tiers)[number]["id"]) {
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
    <main className="min-h-screen bg-bg px-4 pb-28 pt-4 text-ink sm:pt-5">
      <header className="mx-auto w-full max-w-xl">
        <h1 className="font-display text-2xl font-semibold">Packages & Purchases</h1>
        <p className="mt-1 text-sm text-sub">
          Current plan: <span className="font-semibold capitalize text-ink">{me.plan}</span> · Boosts: {me.boostCredits}
        </p>
      </header>

      <section className="mx-auto mt-4 grid max-w-xl gap-3 sm:mt-6 sm:gap-4">
        {tiers.map((tier) => (
          <article key={tier.id} className="card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold">{tier.name}</h2>
                <p className="text-sm text-sub">{tier.blurb}</p>
              </div>
              <p className="text-lg font-semibold text-accent2">{tier.price}</p>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-sub">
              {tier.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void choosePlan(tier.id)}
              className="pill-grad mt-5 w-full"
              disabled={me.plan === tier.id}
            >
              {me.plan === tier.id ? "Current plan" : `Choose ${tier.name}`}
            </button>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-5 max-w-xl sm:mt-6">
        <h3 className="font-display text-xl font-semibold">One-time purchases</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {oneTime.map((item) => (
            <article key={item.label} className="card p-4">
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-sub">{item.price}</p>
              <button
                type="button"
                className="btn-ghost mt-3 w-full"
                onClick={() => void buyItem(item.label, item.price, item.boosts)}
              >
                Buy
              </button>
            </article>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
