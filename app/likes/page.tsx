"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { BottomNav } from "@/components/app/BottomNav";
import { MOCK_PROFILES } from "@/lib/mockData";
import { useStore } from "@/lib/store";

export default function LikesPage() {
  const me = useStore((s) => s.me);
  const likedYou = useStore((s) => s.likedYou);
  const likeBack = useStore((s) => s.likeBack);
  const router = useRouter();
  const premiumUnlocked = me.plan !== "explorer";

  const profiles = useMemo(
    () => likedYou.map((id) => MOCK_PROFILES.find((p) => p.id === id)).filter(Boolean),
    [likedYou]
  );

  return (
    <main className="min-h-screen bg-bg px-4 pb-28 pt-4 text-ink sm:pt-5">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Likes You</h1>
        <Link href="/premium" className="btn-ghost text-sm">
          Upgrade
        </Link>
      </header>

      {!premiumUnlocked ? (
        <section className="card mx-auto mt-6 max-w-xl p-7">
          <p className="text-lg font-semibold">Unlock who liked you</p>
          <p className="mt-2 text-base text-sub">
            Upgrade to Plus or higher to see everyone who liked your profile and like them back instantly.
          </p>
          <Link href="/premium" className="pill-grad mt-5 inline-flex">
            View plans
          </Link>
        </section>
      ) : (
        <section className="mx-auto mt-6 max-w-xl space-y-3">
          {profiles.length === 0 ? (
            <p className="card p-7 text-base text-sub">No new likes yet.</p>
          ) : (
            profiles.map((p) => (
              <article key={p!.id} className="card flex items-center justify-between gap-3 p-4 sm:p-5">
                <div>
                  <p className="text-lg font-semibold">
                    {p!.name}, {p!.age}
                  </p>
                  <p className="text-sm text-sub">{p!.headline}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className="pill-grad px-4 py-2.5 text-sm"
                    onClick={() => likeBack(p!.id)}
                  >
                    Like back
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-4 py-2.5 text-sm"
                    onClick={() => {
                      const { matchId } = likeBack(p!.id);
                      if (matchId) router.push(`/chat/${matchId}`);
                    }}
                  >
                    Message
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      <BottomNav />
    </main>
  );
}
