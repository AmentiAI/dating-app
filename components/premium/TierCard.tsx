"use client";

import type { ComponentType } from "react";
import type { Me } from "@/lib/types";

export const tiers = [
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

export type TierId = (typeof tiers)[number]["id"];
type Tier = (typeof tiers)[number];

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" className="stroke-current opacity-25" strokeWidth="1.25" />
      <path
        d="M5.5 10.2 8.4 13l6.1-6.1"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DecoSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden>
      <path
        d="M88 12l2.2 6.8h7l-5.7 4.2 2.2 6.8L88 25.6l-4.7 3.4 2.2-6.8-5.7-4.2h7L88 12Z"
        className="fill-white/50"
      />
      <path
        d="M24 78l3 9.2h9.7L30.8 99l3 9.2L24 96.4l-9.8 7.1 3-9.2-9.8-7.1h9.7L24 78Z"
        className="fill-white/35"
      />
      <circle cx="102" cy="72" r="3" className="fill-white/40" />
      <circle cx="18" cy="28" r="2" className="fill-white/30" />
    </svg>
  );
}

function IconExplorer({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="22" r="14" className="stroke-current" strokeWidth="2" opacity={0.35} />
      <path
        d="M24 8v6M24 30v6M10 22h6M32 22h6"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.45}
      />
      <path
        d="M24 15l7 12H17l7-12Z"
        className="fill-current"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        opacity={0.95}
      />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 38c7.7 0 14-6.3 14-14S31.7 10 24 10 10 16.3 10 24s6.3 14 14 14Z"
        className="stroke-current"
        strokeWidth="2"
        opacity={0.35}
      />
      <path
        d="M24 16c-3 4-6 7.5-6 12a6 6 0 0 0 12 0c0-4.5-3-8-6-12Z"
        className="fill-current"
        opacity={0.95}
      />
    </svg>
  );
}

function IconPremium({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 8l4.5 9.2L38 19l-7.5 7.3L32 38l-8-4.4-8 4.4 1.5-11.7L10 19l9.5-1.8L24 8Z"
        className="fill-current"
        opacity={0.95}
      />
      <path
        d="M24 14l-2 6h-6.5l5.2 3.8-2 6.2L24 26l5.3 4-2-6.2 5.2-3.8H26l-2-6Z"
        className="fill-white"
        opacity={0.4}
      />
    </svg>
  );
}

function IconElite({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M10 22 L16 12 L24 18 L32 12 L38 22 L36 34 H12 L10 22Z"
        fill="currentColor"
        opacity={0.92}
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M14 34h20" className="stroke-current" strokeWidth="2" strokeLinecap="round" opacity={0.5} />
      <circle cx="24" cy="12" r="3.5" className="fill-[#f0d080]" />
    </svg>
  );
}

type IconComp = ComponentType<{ className?: string }>;

const tierVisual: Record<
  TierId,
  {
    icon: IconComp;
    shell: string;
    iconWrap: string;
    accent: string;
    deco: string;
  }
> = {
  explorer: {
    icon: IconExplorer,
    shell:
      "border-line/80 bg-gradient-to-br from-surface via-surface to-surface2/80 shadow-card ring-1 ring-ink/[0.04]",
    iconWrap: "bg-surface2 text-sub ring-1 ring-line/60",
    accent: "text-sub",
    deco: "text-accent2/30"
  },
  plus: {
    icon: IconPlus,
    shell:
      "border-accent/25 bg-gradient-to-br from-white via-surface to-accent2/15 shadow-glow ring-1 ring-accent/20",
    iconWrap: "bg-grad-pill text-white shadow-glow ring-1 ring-white/30",
    accent: "text-accent3",
    deco: "text-accent/25"
  },
  premium: {
    icon: IconPremium,
    shell:
      "border-accent3/30 bg-gradient-to-br from-surface via-accent2/12 to-accent3/20 shadow-card ring-1 ring-accent3/15",
    iconWrap: "bg-gradient-to-br from-accent3 to-accent text-white shadow-md ring-1 ring-white/25",
    accent: "text-accent3",
    deco: "text-accent3/20"
  },
  elite: {
    icon: IconElite,
    shell:
      "border-gold/40 bg-gradient-to-br from-[#1a1530] via-[#252042] to-[#1e1a38] text-white shadow-card ring-1 ring-gold/30",
    iconWrap: "bg-gradient-to-br from-gold to-[#c9a227] text-[#1a1530] shadow-md ring-1 ring-white/20",
    accent: "text-gold",
    deco: "text-gold/15"
  }
};

export function TierCard({ tier, me, onChoose }: { tier: Tier; me: Me; onChoose: (id: TierId) => void }) {
  const v = tierVisual[tier.id];
  const isElite = tier.id === "elite";
  const isCurrent = me.plan === tier.id;
  const Icon = v.icon;

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${v.shell}`}
    >
      <div className={`pointer-events-none absolute -right-6 -top-6 h-36 w-36 ${v.deco}`} aria-hidden>
        <DecoSparkles className="h-full w-full opacity-80" />
      </div>
      <div
        className="pointer-events-none absolute -bottom-8 left-1/2 h-32 w-[120%] -translate-x-1/2 bg-grad-aurora opacity-40 blur-2xl"
        aria-hidden
      />

      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-8 [&>svg]:w-8 ${v.iconWrap}`}
        >
          <Icon className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={`font-display text-2xl font-semibold ${isElite ? "text-white" : "text-ink"}`}>
              {tier.name}
            </h2>
            <p className={`text-lg font-bold tabular-nums ${isElite ? "text-gold" : v.accent}`}>{tier.price}</p>
          </div>
          <p className={`mt-1 text-sm ${isElite ? "text-white/70" : "text-sub"}`}>{tier.blurb}</p>
        </div>
      </div>

      <ul className="relative mt-5 space-y-2.5">
        {tier.features.map((f) => (
          <li key={f} className={`flex items-start gap-3 text-sm ${isElite ? "text-white/85" : "text-sub"}`}>
            <span className={`mt-0.5 shrink-0 ${isElite ? "text-gold" : "text-accent2"}`}>
              <CheckGlyph className="h-5 w-5" />
            </span>
            <span className="leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChoose(tier.id)}
        className={
          isCurrent
            ? `relative mt-6 w-full rounded-full border py-3.5 text-base font-semibold transition ${
                isElite ? "border-white/25 bg-white/10 text-white" : "border-line bg-surface2/80 text-sub"
              }`
            : isElite
              ? "relative mt-6 w-full rounded-full bg-gradient-to-r from-gold via-[#f0d080] to-gold py-3.5 text-base font-semibold text-[#1a1530] shadow-md ring-1 ring-gold/50 transition hover:brightness-105 active:scale-[0.99]"
              : "pill-grad relative mt-6 w-full shadow-glow transition active:scale-[0.99]"
        }
        disabled={isCurrent}
      >
        {isCurrent ? "Current plan" : `Choose ${tier.name}`}
      </button>
    </article>
  );
}

export function TierGrid({ me, onChoose }: { me: Me; onChoose: (id: TierId) => void }) {
  return (
    <section className="mx-auto mt-4 grid max-w-xl gap-4 sm:mt-6 sm:gap-5">
      {tiers.map((tier) => (
        <TierCard key={tier.id} tier={tier} me={me} onChoose={onChoose} />
      ))}
    </section>
  );
}
