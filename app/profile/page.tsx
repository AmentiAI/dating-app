"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/app/BottomNav";
import { useStore } from "@/lib/store";

export default function ProfilePage() {
  const router = useRouter();
  const me = useStore((s) => s.me);
  const updateMe = useStore((s) => s.updateMe);

  const [name, setName] = useState(me.name);
  const [city, setCity] = useState(me.city);
  const [bio, setBio] = useState(me.bio);
  const [intent, setIntent] = useState(me.intent);
  const [interests, setInterests] = useState(me.interests.join(", "));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(me.name);
    setCity(me.city);
    setBio(me.bio);
    setIntent(me.intent);
    setInterests(me.interests.join(", "));
  }, [me]);

  function save(e: FormEvent) {
    e.preventDefault();
    updateMe({
      name: name.trim() || me.name,
      city: city.trim() || me.city,
      bio: bio.trim() || me.bio,
      intent,
      interests: interests
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  }

  return (
    <main className="min-h-screen bg-bg px-4 pb-28 pt-4 text-ink sm:pt-5">
      <header className="mx-auto w-full max-w-xl">
        <h1 className="font-display text-2xl font-semibold">Edit Profile</h1>
      </header>

      <form onSubmit={save} className="card mx-auto mt-4 max-w-xl space-y-4 p-5 sm:mt-6 sm:p-6">
        <label className="block">
          <span className="mb-1.5 block text-sm text-sub">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-sub">City</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-sub">Intent</span>
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value as typeof me.intent)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
          >
            {["long-term", "marriage", "casual", "friends", "open-to-anything"].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-sub">Bio</span>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-sub">Interests (comma-separated)</span>
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
          />
        </label>

        <button type="submit" className="pill-grad w-full">
          {saved ? "Saved" : "Save profile"}
        </button>
        <button
          type="button"
          className="btn-ghost w-full"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
            router.push("/login");
          }}
        >
          Log out
        </button>
      </form>

      <BottomNav />
    </main>
  );
}
