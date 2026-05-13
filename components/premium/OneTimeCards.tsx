"use client";

function IconBoost({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M18 4L8 18h8l-2 10 12-16h-8l2-8Z"
        className="fill-current"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinejoin="round"
        opacity={0.95}
      />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 4l3.5 7.5L27 13l-6 5.2L22.5 27 16 23l-6.5 4 1.5-8.8L5 13l7.5-1.5L16 4Z"
        className="fill-current stroke-current"
        strokeWidth="0.75"
        strokeLinejoin="round"
        opacity={0.9}
      />
    </svg>
  );
}

function IconSpotlight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="6" className="stroke-current" strokeWidth="2" opacity={0.6} />
      <path d="M16 2v4M16 26v4M30 16h-4M6 16H2M25.9 6.1l-2.8 2.8M8.9 23.1l-2.8 2.8M25.9 25.9l-2.8-2.8M8.9 8.9 6.1 6.1" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" opacity={0.45} />
    </svg>
  );
}

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M9 6h14v20l-2-1.5L19 26l-3-1.5L13 26l-2 1.5V6Z" className="stroke-current" strokeWidth="1.75" strokeLinejoin="round" opacity={0.85} />
      <path d="M12 11h8M12 15h8M12 19h5" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
    </svg>
  );
}

function IconSparkChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M8 10c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5l-4 3v-3h-3a2 2 0 0 1-2-2v-6Z"
        className="stroke-current"
        strokeWidth="1.75"
        strokeLinejoin="round"
        opacity={0.85}
      />
      <path d="M22 6l2-2M26 8l2-2M20 4l1-2" className="stroke-accent stroke-[2]" strokeLinecap="round" opacity={0.7} />
    </svg>
  );
}

const oneTime = [
  { label: "1 Boost", price: "$1.99", boosts: 1, icon: IconBoost, ring: "from-accent/30 to-accent2/40 text-accent3" },
  { label: "5 Boosts", price: "$6.99", boosts: 5, icon: IconBoost, ring: "from-accent2/40 to-accent3/35 text-accent3" },
  { label: "Super Like", price: "$0.99", boosts: 0, icon: IconStar, ring: "from-gold/40 to-accent2/50 text-gold" },
  { label: "Profile Spotlight", price: "$4.99", boosts: 0, icon: IconSpotlight, ring: "from-accent2/35 to-gold/30 text-sub" },
  { label: "Read receipt pack", price: "$2.99", boosts: 0, icon: IconReceipt, ring: "from-sub/25 to-accent3/25 text-sub" },
  { label: "AI opener pack", price: "$3.99", boosts: 0, icon: IconSparkChat, ring: "from-accent3/35 to-accent/25 text-accent3" }
] as const;

export function OneTimeGrid({ onBuy }: { onBuy: (label: string, price: string, boosts: number) => void }) {
  return (
    <section className="mx-auto mt-8 max-w-xl sm:mt-10">
      <div className="flex items-center gap-2">
        <svg className="h-6 w-6 text-accent3" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v3M12 18v3M4.5 12H2M22 12h-2.5M6.4 6.4L4.9 4.9M19.1 19.1l-1.5-1.5M6.4 17.6l-1.5 1.5M19.1 4.9l-1.5 1.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            opacity={0.6}
          />
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
        <h3 className="font-display text-xl font-semibold text-ink">One-time purchases</h3>
      </div>
      <p className="mt-1 text-sm text-sub">Stack boosts and extras — billed locally in this demo.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {oneTime.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.label}
              className="group relative overflow-hidden rounded-2xl border border-line/70 bg-gradient-to-br from-surface to-surface2/60 p-4 shadow-sm ring-1 ring-ink/[0.03] transition hover:border-accent2/40 hover:shadow-md"
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-grad-aurora opacity-30 blur-2xl transition group-hover:opacity-50" />
              <div className="relative flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.ring} ring-1 ring-white/60 [&>svg]:h-6 [&>svg]:w-6`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{item.label}</p>
                  <p className="text-sm font-medium text-accent3">{item.price}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-ghost relative mt-4 w-full text-sm font-semibold"
                onClick={() => onBuy(item.label, item.price, item.boosts)}
              >
                Buy
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
