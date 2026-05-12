"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/app/BottomNav";
import { MOCK_PROFILES } from "@/lib/mockData";
import { useStore } from "@/lib/store";
import type { Profile } from "@/lib/types";

function pickPhoto(p: Profile): string | null {
  const ph = p.media.find((m) => m.kind === "photo");
  return ph?.url ?? null;
}

export default function LikesPage() {
  const me = useStore((s) => s.me);
  const likedYou = useStore((s) => s.likedYou);
  const likeBack = useStore((s) => s.likeBack);
  const router = useRouter();
  const premiumUnlocked = me.plan !== "explorer";

  const [likesSource, setLikesSource] = useState<"loading" | "db" | "mock">(() =>
    useStore.getState().me.plan !== "explorer" ? "loading" : "mock"
  );
  const [dbLikers, setDbLikers] = useState<Profile[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!premiumUnlocked) {
      setLikesSource("mock");
      return;
    }
    setLikesSource("loading");
    const ac = new AbortController();
    (async () => {
      try {
        const authRes = await fetch("/api/auth/me", { cache: "no-store", signal: ac.signal });
        const authJson = (await authRes.json()) as { user?: { id: string } | null };
        if (!authJson?.user) {
          if (!ac.signal.aborted) setLikesSource("mock");
          return;
        }
        const res = await fetch("/api/likes-you", { cache: "no-store", signal: ac.signal });
        if (res.status === 403 || res.status === 401) {
          if (!ac.signal.aborted) setLikesSource("mock");
          return;
        }
        if (!res.ok) {
          if (!ac.signal.aborted) setLikesSource("mock");
          return;
        }
        const data = (await res.json()) as { profiles?: Profile[] };
        if (ac.signal.aborted) return;
        setDbLikers(data.profiles ?? []);
        setLikesSource("db");
      } catch {
        if (!ac.signal.aborted) setLikesSource("mock");
      }
    })();
    return () => ac.abort();
  }, [premiumUnlocked]);

  const mockProfiles = useMemo(
    () => likedYou.map((id) => MOCK_PROFILES.find((p) => p.id === id)).filter(Boolean) as Profile[],
    [likedYou]
  );

  const profiles = likesSource === "db" ? dbLikers : mockProfiles;

  const likeBackRemote = useCallback(
    async (p: Profile): Promise<{ matchId?: string; error?: string }> => {
      setNotice(null);
      const res = await fetch("/api/swipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swipedUserId: p.id, type: "like" })
      });
      let json: {
        error?: string;
        duplicate?: boolean;
        matched?: boolean;
        matchId?: string;
        compatibility?: number;
      } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        return { error: "Request failed." };
      }
      if (!res.ok) {
        return { error: typeof json.error === "string" ? json.error : "Could not like back." };
      }

      if (json.duplicate) {
        const existing = useStore.getState().matches.find((m) => m.profileId === p.id);
        setDbLikers((prev) => prev.filter((x) => x.id !== p.id));
        return existing ? { matchId: existing.id } : {};
      }

      if (json.matched && json.matchId) {
        useStore.getState().addRealMatch({
          matchId: json.matchId,
          profile: p,
          compatibility: typeof json.compatibility === "number" ? json.compatibility : 85
        });
      }
      setDbLikers((prev) => prev.filter((x) => x.id !== p.id));
      if (me.plan === "explorer") {
        useStore.getState().bumpDailyLikeIfExplorer();
      }
      return { matchId: json.matchId };
    },
    [me.plan]
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
          {likesSource === "loading" && (
            <div className="card p-8 text-center text-sm text-sub">Loading people who liked you…</div>
          )}
          {likesSource !== "loading" && notice && (
            <p className="rounded-xl border border-gold/50 bg-gold/10 px-3 py-2 text-sm text-ink">{notice}</p>
          )}
          {likesSource !== "loading" && profiles.length === 0 ? (
            <p className="card p-7 text-base text-sub">No new likes yet.</p>
          ) : null}
          {likesSource !== "loading" &&
            profiles.map((p) => (
              <article key={p.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface2 sm:h-20 sm:w-20">
                    {pickPhoto(p) ? (
                      <Image
                        src={pickPhoto(p)!}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted">No photo</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">
                      {p.name}, {p.age}
                    </p>
                    <p className="line-clamp-2 text-sm text-sub">{p.headline}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className="pill-grad px-4 py-2.5 text-sm"
                    onClick={async () => {
                      if (likesSource === "db") {
                        const r = await likeBackRemote(p);
                        if (r.error) setNotice(r.error);
                      } else {
                        likeBack(p.id);
                      }
                    }}
                  >
                    Like back
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-4 py-2.5 text-sm"
                    onClick={async () => {
                      if (likesSource === "db") {
                        const r = await likeBackRemote(p);
                        if (r.error) {
                          setNotice(r.error);
                          return;
                        }
                        if (r.matchId) router.push(`/chat/${r.matchId}`);
                      } else {
                        const { matchId } = likeBack(p.id);
                        if (matchId) router.push(`/chat/${matchId}`);
                      }
                    }}
                  >
                    Message
                  </button>
                </div>
              </article>
            ))}
        </section>
      )}

      <BottomNav />
    </main>
  );
}
