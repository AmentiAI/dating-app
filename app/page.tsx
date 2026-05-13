import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { WaitlistDemo } from "@/components/landing/WaitlistDemo";

export const dynamic = "force-dynamic";

async function databaseOk(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export default async function HomePage() {
  const dbOk = await databaseOk();

  return (
    <main className="min-h-screen bg-bg text-ink aurora">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/preference-plus-logo.png"
              alt="Preference Plus"
              width={42}
              height={42}
              className="rounded-xl border border-line/60 bg-white/70 object-cover"
            />
            <div className="leading-tight">
              <p className="font-display text-base font-semibold tracking-tight sm:text-lg">Preference Plus</p>
              <p className="hidden text-xs text-sub sm:block">Intentional dating, transparent compatibility</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <span
              className={`hidden rounded-full border px-3 py-1 sm:inline-flex ${
                dbOk ? "border-accent3/40 text-accent3" : "border-gold/40 text-gold"
              }`}
            >
              {dbOk ? "Dating app live" : "Service syncing"}
            </span>
            <Link href="/signup" className="pill-grad px-4 py-2.5 text-xs shadow-glow sm:px-5 sm:py-3 sm:text-sm">
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-5 sm:pb-20 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative">
            <div className="pointer-events-none absolute -left-10 top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
            <p className="mb-4 inline-flex rounded-full border border-line/70 bg-white/75 px-3 py-1 text-xs font-medium text-sub">
              Built for intentional dating
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Find people who actually fit what you&apos;re looking for.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-sub sm:text-xl">
              Mutual preferences, honest dealbreakers, and compatibility you can see before you invest
              emotion. Built for higher-signal matches—not endless noise.
            </p>
            <div className="mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              <Link href="/signup" className="pill-grad text-center">
                Start onboarding
              </Link>
              <Link href="/login?next=/discover" className="btn-ghost text-center">
                Sign in to discover
              </Link>
            </div>
            <dl className="mt-8 grid max-w-lg grid-cols-1 gap-4 text-left sm:mt-10 sm:grid-cols-3 sm:gap-5">
              <div className="rounded-2xl border border-line/60 bg-surface/60 p-5">
                <dt className="text-xs uppercase tracking-wide text-muted">Hook</dt>
                <dd className="mt-1 text-base font-semibold text-ink">Mutual compatibility gate</dd>
              </div>
              <div className="rounded-2xl border border-line/60 bg-surface/60 p-5">
                <dt className="text-xs uppercase tracking-wide text-muted">Trust</dt>
                <dd className="mt-1 text-base font-semibold text-ink">Private preferences</dd>
              </div>
              <div className="rounded-2xl border border-line/60 bg-surface/60 p-5">
                <dt className="text-xs uppercase tracking-wide text-muted">Premium</dt>
                <dd className="mt-1 text-base font-semibold text-ink">Elite matches & insights</dd>
              </div>
            </dl>
            <div className="mt-6 rounded-2xl border border-accent2/30 bg-accent2/10 px-5 py-4 text-sm text-sub">
              New: onboarding now includes race and weight preference filters to sharpen mutual-fit matching.
            </div>
          </div>
          <div className="relative">
            <div className="mb-4 mt-2 flex justify-center lg:justify-start">
              <Image
                src="/preference-plus-logo.png"
                alt="Preference Plus logo"
                width={220}
                height={220}
                className="h-auto w-44 rounded-3xl border border-line/70 bg-white/80 p-2 shadow-card sm:w-[220px]"
              />
            </div>
            <div className="card relative overflow-hidden p-1 shadow-glow">
              <div className="rounded-[22px] bg-gradient-to-br from-surface2 to-surface p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Compatibility preview</p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sub">Live</span>
                </div>
                <div className="mt-6 flex items-end gap-2">
                  <span className="font-display text-6xl font-semibold text-ink">92</span>
                  <span className="pb-2 text-lg text-sub">% match</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-sub">
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent3" />
                    Shared long-term intent
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent2" />
                    Both active lifestyles
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    Overlapping values & interests
                  </li>
                </ul>
                <div className="mt-8 rounded-2xl border border-line/70 bg-white/70 p-4 text-xs text-muted">
                  AI summaries, icebreakers, and moderation are integrated to help you match with people who fit
                  your real relationship goals.
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-accent2/20 blur-3xl" />
          </div>
        </div>
      </section>

      <section className="border-y border-line/60 bg-surface/40 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Why modern dating feels broken</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Opaque algorithms",
                body: "You swipe blind. Compatibility is a black box—so matches feel random and exhausting."
              },
              {
                title: "Preference theater",
                body: "People state one thing publicly and mean another privately. That mismatch wastes everyone’s time."
              },
              {
                title: "No accountability",
                body: "Low intent, spam, and scam-adjacent behavior thrive when platforms optimize for engagement, not outcomes."
              }
            ].map((c) => (
              <article key={c.title} className="rounded-3xl border border-line/60 bg-bg/60 p-6">
                <h3 className="font-semibold text-ink">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-sub">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Preference transparency</h2>
            <p className="mt-4 text-sub">
              Filters and dealbreakers stay private to you—while the product still rewards honest, mutual fit.
              The feed emphasizes people who clear your bar and whose bar you clear too.
            </p>
          </div>
          <WaitlistDemo />
        </div>
      </section>

      <section className="border-t border-line/60 bg-bg pb-16 pt-10 sm:pb-20 sm:pt-12">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-5">
          <p className="text-sm text-sub">Social proof</p>
          <p className="mx-auto mt-4 max-w-2xl font-display text-xl font-medium leading-snug text-ink sm:text-2xl">
            “I’d rather see a 94% compatibility reveal than another ‘wyd’ at midnight.”
          </p>
          <p className="mt-3 text-sm text-muted">— Beta tester, NYC</p>
        </div>
      </section>

      <footer className="border-t border-line/60 py-10 text-center text-xs text-muted">
        Preference Plus · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
