"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/app/BottomNav";
import { useStore } from "@/lib/store";
import type { Match } from "@/lib/types";

function displayName(m: Match): string {
  return m.otherName ?? "Match";
}

function displayPhoto(m: Match): string | null {
  return m.otherPhotoUrl ?? null;
}

export default function MatchesPage() {
  const router = useRouter();
  const matches = useStore((s) => s.matches);
  const [sessionOk, setSessionOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      if (!res?.ok || cancelled) return;
      const data = (await res.json()) as { user: { onboarded?: boolean } | null };
      if (cancelled) return;
      if (!data.user) {
        router.replace("/login?next=/matches");
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

  const sorted = useMemo(
    () => [...matches].sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()),
    [matches]
  );

  if (!sessionOk) {
    return (
      <div className="min-h-screen bg-bg px-4 pb-20 pt-8 text-ink">
        <p className="mx-auto max-w-md text-center text-sm text-sub">Loading…</p>
      </div>
    );
  }

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
          <div className="rounded-3xl border border-line/60 bg-surface p-7 text-center">
            <p className="text-base text-sub">
              No matches yet. When you and someone both like each other, they appear here.
            </p>
            <Link href="/discover" className="pill-grad mt-5 inline-flex w-full justify-center sm:w-auto sm:min-w-[200px]">
              Open Discover
            </Link>
          </div>
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
