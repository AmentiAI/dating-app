"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { normalizeMedia } from "@/lib/media";
import { useStore } from "@/lib/store";
import type { Match } from "@/lib/types";

type MeResponse = {
  user: null | {
    id: string;
    email: string;
    username: string;
    plan: "explorer" | "plus" | "premium" | "elite";
    onboarded?: boolean;
    profile: null | {
      city: string | null;
      bio: string | null;
      intent: string | null;
    };
  };
};

export function SessionBootstrap() {
  const pathname = usePathname();
  const updateMe = useStore((s) => s.updateMe);
  const setPlan = useStore((s) => s.setPlan);

  useEffect(() => {
    let mounted = true;
    async function run() {
      const res = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      if (!mounted || !res?.ok) return;
      const data = (await res.json()) as MeResponse;
      if (!data.user) {
        if (useStore.getState().me.id) {
          useStore.getState().resetForLogout();
        }
        return;
      }

      const prevId = useStore.getState().me.id;
      if (prevId && prevId !== data.user.id) {
        useStore.getState().resetForLogout();
      }

      const patch: Parameters<typeof updateMe>[0] = {
        id: data.user.id,
        name: data.user.username,
        onboarded: data.user.onboarded === true
      };
      if (data.user.profile?.city) patch.city = data.user.profile.city;
      if (data.user.profile?.bio) patch.bio = data.user.profile.bio;
      if (
        data.user.profile?.intent === "long-term" ||
        data.user.profile?.intent === "marriage" ||
        data.user.profile?.intent === "casual" ||
        data.user.profile?.intent === "friends" ||
        data.user.profile?.intent === "open-to-anything" ||
        data.user.profile?.intent === "short-term" ||
        data.user.profile?.intent === "ethical-non-monogamy"
      ) {
        patch.intent = data.user.profile.intent;
      }
      updateMe(patch);
      setPlan(data.user.plan);
      const curr = useStore.getState().me.media;
      const fixed = normalizeMedia(curr);
      if (JSON.stringify(curr) !== JSON.stringify(fixed)) {
        updateMe({ media: fixed });
      }

      if (data.user.onboarded === true) {
        const mRes = await fetch("/api/matches", { cache: "no-store" }).catch(() => null);
        if (mRes?.ok) {
          const mData = (await mRes.json()) as { matches?: Match[] };
          useStore.getState().mergeMatchesFromApi(mData.matches ?? []);
        }
      }
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [setPlan, updateMe, pathname]);

  return null;
}
