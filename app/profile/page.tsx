"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/app/BottomNav";
import { toProxyPhotoUrl } from "@/lib/media";
import type { Intent, Vibe } from "@/lib/types";
import { useStore } from "@/lib/store";

const intentOptions = ["long-term", "marriage", "casual", "friends", "open-to-anything"] as const;
const vibeOptions = [
  "homebody",
  "adventurer",
  "creative",
  "athletic",
  "foodie",
  "intellectual",
  "spiritual",
  "ambitious",
  "chill",
  "party",
  "outdoorsy",
  "techy",
  "artsy",
  "musical",
  "bookish"
] as const;
const raceOptions = ["Asian", "Black", "Latino", "Middle Eastern", "White", "South Asian", "Mixed", "Other"];
const dealbreakerOptions = [
  "Smoking",
  "Long distance",
  "Intentions mismatch",
  "Wants kids",
  "Inactive lifestyle",
  "Heavy drinking",
  "Politics",
  "Religion"
];

type ProfileDto = {
  userId: string;
  name: string;
  city: string;
  bio: string;
  intent: string;
  interests: string[];
  photoUrls: string[];
  hasDeviceLocation?: boolean;
  filters: {
    ageRange: [number, number];
    maxDistanceKm: number;
    heightRange: [number, number];
    weightRange: [number, number];
    intents: string[];
    vibes: string[];
    preferredRaces: string[];
    verifiedOnly: boolean;
  };
  dealbreakers: string[];
};

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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [maxDistanceKm, setMaxDistanceKm] = useState(me.filters.maxDistanceKm);
  const [ageMin, setAgeMin] = useState(me.filters.ageRange[0]);
  const [ageMax, setAgeMax] = useState(me.filters.ageRange[1]);
  const [heightMin, setHeightMin] = useState(me.filters.heightRange?.[0] ?? 64);
  const [heightMax, setHeightMax] = useState(me.filters.heightRange?.[1] ?? 74);
  const [weightMin, setWeightMin] = useState(me.filters.weightRange?.[0] ?? 110);
  const [weightMax, setWeightMax] = useState(me.filters.weightRange?.[1] ?? 220);
  const [preferredRaces, setPreferredRaces] = useState<string[]>(me.filters.preferredRaces ?? []);
  const [preferredIntents, setPreferredIntents] = useState<string[]>(me.filters.intents ?? []);
  const [preferredVibes, setPreferredVibes] = useState<string[]>(me.filters.vibes ?? []);
  const [verifiedOnly, setVerifiedOnly] = useState(me.filters.verifiedOnly);
  const [dealbreakers, setDealbreakers] = useState<string[]>(me.dealbreakers ?? []);
  const [hasDeviceLocation, setHasDeviceLocation] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationMsg, setLocationMsg] = useState<string | null>(null);

  const photoUrls = useMemo(
    () => me.media.filter((m) => m.kind === "photo").map((m) => toProxyPhotoUrl(m.url)),
    [me.media]
  );

  function applyFromServer(data: ProfileDto) {
    const base = useStore.getState().me;
    updateMe({
      id: data.userId,
      name: data.name,
      city: data.city,
      bio: data.bio,
      intent: data.intent as Intent,
      interests: data.interests,
      media: data.photoUrls.map((u) => ({ kind: "photo" as const, url: toProxyPhotoUrl(u) })),
      filters: {
        ...base.filters,
        ageRange: data.filters.ageRange,
        maxDistanceKm: data.filters.maxDistanceKm,
        heightRange: data.filters.heightRange,
        weightRange: data.filters.weightRange,
        intents: data.filters.intents as Intent[],
        vibes: data.filters.vibes as Vibe[],
        preferredRaces: data.filters.preferredRaces,
        verifiedOnly: data.filters.verifiedOnly
      },
      dealbreakers: data.dealbreakers,
      onboarded: true
    });
    setHasDeviceLocation(data.hasDeviceLocation === true);
    setName(data.name);
    setCity(data.city);
    setBio(data.bio);
    setIntent(data.intent as Intent);
    setInterests(data.interests.join(", "));
    setMaxDistanceKm(data.filters.maxDistanceKm);
    setAgeMin(data.filters.ageRange[0]);
    setAgeMax(data.filters.ageRange[1]);
    setHeightMin(data.filters.heightRange[0]);
    setHeightMax(data.filters.heightRange[1]);
    setWeightMin(data.filters.weightRange[0]);
    setWeightMax(data.filters.weightRange[1]);
    setPreferredRaces(data.filters.preferredRaces ?? []);
    setPreferredIntents(data.filters.intents ?? []);
    setPreferredVibes(data.filters.vibes ?? []);
    setVerifiedOnly(data.filters.verifiedOnly);
    setDealbreakers(data.dealbreakers ?? []);
    setHasDeviceLocation(data.hasDeviceLocation === true);
    setPreviewIndex(0);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/profile", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setLoadStatus("error");
          return;
        }
        const data = (await res.json()) as ProfileDto;
        if (cancelled) return;
        applyFromServer(data);
        if (!cancelled) setLoadStatus("ready");
      } catch {
        if (!cancelled) setLoadStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, [router]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    const interestList = interests
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          bio: bio.trim(),
          intent,
          interests: interestList,
          photoUrls,
          filters: {
            ageRange: [Math.min(ageMin, ageMax), Math.max(ageMin, ageMax)],
            maxDistanceKm,
            heightRange: [Math.min(heightMin, heightMax), Math.max(heightMin, heightMax)],
            weightRange: [Math.min(weightMin, weightMax), Math.max(weightMin, weightMax)],
            intents: preferredIntents,
            vibes: preferredVibes,
            preferredRaces: preferredRaces,
            verifiedOnly
          },
          dealbreakers
        })
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setSaveError(j.error ?? "Save failed");
        return;
      }
      const data = (await res.json()) as ProfileDto;
      applyFromServer(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    } catch {
      setSaveError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCoordinates(coords: { latitude: number; longitude: number } | null) {
    setLocationMsg(null);
    setLocationSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: coords })
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setLocationMsg(j.error ?? "Could not update location.");
        return;
      }
      const data = (await res.json()) as ProfileDto;
      applyFromServer(data);
      setLocationMsg(coords === null ? "Saved location cleared." : "Saved your approximate position for Discover.");
      setTimeout(() => setLocationMsg(null), 2500);
    } catch {
      setLocationMsg("Network error.");
    } finally {
      setLocationSaving(false);
    }
  }

  function requestDeviceLocation() {
    setLocationMsg(null);
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationMsg("Location is not available in this browser.");
      return;
    }
    if (!window.isSecureContext) {
      setLocationMsg("Use HTTPS (or localhost) to enable location.");
      return;
    }
    setLocationSaving(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void saveCoordinates({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      () => {
        setLocationSaving(false);
        setLocationMsg("Permission denied or unavailable. You can still use city-based distance.");
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 }
    );
  }

  function setPhotos(nextUrls: string[]) {
    updateMe({
      media: [
        ...nextUrls.map((url) => ({ kind: "photo" as const, url: toProxyPhotoUrl(url) })),
        ...me.media.filter((m) => m.kind !== "photo")
      ]
    });
    setPreviewIndex((idx) => Math.max(0, Math.min(idx, Math.max(0, nextUrls.length - 1))));
  }

  async function uploadFiles(files: FileList | null, replaceAt?: number) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const picked = Array.from(files).slice(0, 6);
      const uploaded: string[] = [];
      for (const file of picked) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        const json = (await res.json()) as { viewUrl?: string; url?: string; error?: string };
        if (!res.ok || (!json.viewUrl && !json.url)) {
          throw new Error(json.error ?? "Photo upload failed.");
        }
        uploaded.push(toProxyPhotoUrl(json.viewUrl ?? json.url!));
      }

      const next = [...photoUrls];
      if (typeof replaceAt === "number" && uploaded[0]) {
        next[replaceAt] = uploaded[0];
      } else {
        next.push(...uploaded);
      }
      setPhotos(next.slice(0, 6));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(at: number) {
    const next = photoUrls.filter((_, i) => i !== at);
    setPhotos(next);
  }

  function movePhoto(at: number, dir: -1 | 1) {
    const to = at + dir;
    if (to < 0 || to >= photoUrls.length) return;
    const next = [...photoUrls];
    [next[at], next[to]] = [next[to], next[at]];
    setPhotos(next);
    setPreviewIndex(to);
  }

  function toggleChip(current: string[], value: string, setter: (next: string[]) => void) {
    setter(current.includes(value) ? current.filter((x) => x !== value) : [...current, value]);
  }

  if (loadStatus === "loading") {
    return (
      <main className="min-h-screen bg-bg px-4 pb-28 pt-16 text-ink sm:pt-20">
        <p className="mx-auto max-w-xl text-center text-sub">Loading your profile…</p>
        <BottomNav />
      </main>
    );
  }

  if (loadStatus === "error") {
    return (
      <main className="min-h-screen bg-bg px-4 pb-28 pt-16 text-ink">
        <div className="card mx-auto max-w-xl p-6 text-center">
          <p className="font-medium">We couldn&apos;t load your profile.</p>
          <p className="mt-2 text-sm text-sub">
            Sign in, check your connection, or run <code className="text-xs">npm run db:migrate</code> if the database
            is missing new columns.
          </p>
          <button type="button" className="pill-grad mt-4" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-4 pb-28 pt-4 text-ink sm:pt-5">
      <header className="mx-auto w-full max-w-xl">
        <h1 className="font-display text-2xl font-semibold">Edit Profile</h1>
        <div className="mt-3 inline-flex rounded-full border border-line/70 bg-white/75 p-1">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "edit" ? "bg-grad-pill text-white shadow-glow" : "text-sub hover:text-ink"
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "preview" ? "bg-grad-pill text-white shadow-glow" : "text-sub hover:text-ink"
            }`}
          >
            Preview
          </button>
        </div>
      </header>

      {tab === "edit" && (
        <>
      <section className="card mx-auto mt-4 max-w-xl p-5 sm:mt-6 sm:p-6">
        <h2 className="card-title">Your photos</h2>
        <p className="mt-1 text-sm text-sub">Add, remove, and reorder up to 6 photos.</p>

        <label className="mt-4 block w-full rounded-2xl border border-dashed border-line/80 bg-surface px-4 py-3 text-center text-sm font-medium text-sub hover:border-accent2/60 hover:text-ink">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void uploadFiles(e.target.files)}
          />
          {uploading ? "Uploading photos..." : "Add photos from camera roll"}
        </label>

        {uploadError && (
          <p className="mt-3 rounded-xl border border-red-300/50 bg-red-50 px-3 py-2 text-xs text-red-700">
            {uploadError}
          </p>
        )}

        <div className="card-soft-divider mt-4 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photoUrls.map((u, idx) => (
            <article key={`${u}-${idx}`} className="rounded-2xl border border-line/60 bg-white/60 p-2">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface2">
                {/* native img keeps private proxy URLs simple */}
                <img src={u} alt={`Profile ${idx + 1}`} className="h-full w-full object-cover" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => movePhoto(idx, -1)}>
                  ←
                </button>
                <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => movePhoto(idx, 1)}>
                  →
                </button>
                <label className="btn-ghost cursor-pointer px-2 py-1 text-xs">
                  Replace
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => void uploadFiles(e.target.files, idx)}
                  />
                </label>
                <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => removePhoto(idx)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
          {photoUrls.length === 0 && <p className="col-span-full text-sm text-sub">No photos yet.</p>}
          </div>
        </div>
      </section>

      <form onSubmit={save} className="card mx-auto mt-4 max-w-xl space-y-4 p-5 sm:mt-6 sm:p-6">
        <h2 className="card-title">About you</h2>
        <div className="card-soft-divider pt-4" />
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

        <div className="rounded-2xl border border-line/80 bg-surface2/40 p-4">
          <p className="text-sm font-medium text-ink">Discover distance</p>
          <p className="mt-1 text-xs text-sub">
            Optional: save a rough GPS fix so we can rank people by real distance. Only your coordinates are stored;
            we never show exact coordinates to others.
          </p>
          <p className="mt-2 text-xs text-sub">
            Status:{" "}
            <span className="font-semibold text-ink">
              {hasDeviceLocation ? "Precise location on file" : "City / estimate only"}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={locationSaving}
              onClick={() => requestDeviceLocation()}
              className="rounded-full border border-accent2/50 bg-accent2/10 px-4 py-2 text-sm font-semibold text-ink hover:bg-accent2/20 disabled:opacity-50"
            >
              {locationSaving ? "Working…" : "Use device location"}
            </button>
            {hasDeviceLocation && (
              <button
                type="button"
                disabled={locationSaving}
                onClick={() => void saveCoordinates(null)}
                className="rounded-full border border-line px-4 py-2 text-sm text-sub hover:text-ink disabled:opacity-50"
              >
                Clear saved GPS
              </button>
            )}
          </div>
          {locationMsg && <p className="mt-2 text-xs text-sub">{locationMsg}</p>}
        </div>

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

        <div className="card-soft-divider pt-4">
          <h3 className="font-display text-lg font-semibold">Match preferences</h3>
          <p className="mt-1 text-xs text-sub">Everything here is editable any time.</p>
        </div>

        <label className="block text-sm text-sub">
          Distance: <span className="font-semibold text-ink">{maxDistanceKm} km</span>
          <input
            type="range"
            min={1}
            max={200}
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
            className="mt-2 w-full accent-accent2"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm text-sub">
            Min age: <span className="font-semibold text-ink">{ageMin}</span>
            <input
              type="range"
              min={18}
              max={80}
              value={ageMin}
              onChange={(e) => setAgeMin(Number(e.target.value))}
              className="mt-2 w-full accent-accent2"
            />
          </label>
          <label className="block text-sm text-sub">
            Max age: <span className="font-semibold text-ink">{ageMax}</span>
            <input
              type="range"
              min={18}
              max={80}
              value={ageMax}
              onChange={(e) => setAgeMax(Number(e.target.value))}
              className="mt-2 w-full accent-accent2"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm text-sub">
            Min height (in): <span className="font-semibold text-ink">{heightMin}</span>
            <input
              type="range"
              min={48}
              max={84}
              value={heightMin}
              onChange={(e) => setHeightMin(Number(e.target.value))}
              className="mt-2 w-full accent-accent2"
            />
          </label>
          <label className="block text-sm text-sub">
            Max height (in): <span className="font-semibold text-ink">{heightMax}</span>
            <input
              type="range"
              min={48}
              max={84}
              value={heightMax}
              onChange={(e) => setHeightMax(Number(e.target.value))}
              className="mt-2 w-full accent-accent2"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm text-sub">
            Min weight (lb): <span className="font-semibold text-ink">{weightMin}</span>
            <input
              type="range"
              min={80}
              max={350}
              value={weightMin}
              onChange={(e) => setWeightMin(Number(e.target.value))}
              className="mt-2 w-full accent-accent2"
            />
          </label>
          <label className="block text-sm text-sub">
            Max weight (lb): <span className="font-semibold text-ink">{weightMax}</span>
            <input
              type="range"
              min={80}
              max={350}
              value={weightMax}
              onChange={(e) => setWeightMax(Number(e.target.value))}
              className="mt-2 w-full accent-accent2"
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm text-sub">Intent preferences</p>
          <div className="flex flex-wrap gap-2">
            {intentOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleChip(preferredIntents, option, setPreferredIntents)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  preferredIntents.includes(option)
                    ? "border-accent3/60 bg-accent3/15 text-ink"
                    : "border-line bg-surface text-sub"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-sub">Vibe preferences</p>
          <div className="flex flex-wrap gap-2">
            {vibeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleChip(preferredVibes, option, setPreferredVibes)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  preferredVibes.includes(option)
                    ? "border-accent/60 bg-accent/15 text-ink"
                    : "border-line bg-surface text-sub"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-sub">Race preferences</p>
          <div className="flex flex-wrap gap-2">
            {raceOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleChip(preferredRaces, option, setPreferredRaces)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  preferredRaces.includes(option)
                    ? "border-gold/60 bg-gold/15 text-ink"
                    : "border-line bg-surface text-sub"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-sub">Dealbreakers</p>
          <div className="flex flex-wrap gap-2">
            {dealbreakerOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleChip(dealbreakers, option, setDealbreakers)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  dealbreakers.includes(option)
                    ? "border-accent2/60 bg-accent2/20 text-ink"
                    : "border-line bg-surface text-sub"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-2xl border border-line/70 bg-surface px-4 py-3">
          <span className="text-sm font-medium text-ink">Show only verified profiles</span>
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="h-4 w-4 accent-accent2"
          />
        </label>

        {saveError && (
          <p className="rounded-xl border border-red-300/50 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>
        )}

        <button type="submit" className="pill-grad w-full disabled:opacity-60" disabled={saving}>
          {saving ? "Saving…" : saved ? "Saved" : "Save profile"}
        </button>
        <button
          type="button"
          className="btn-ghost w-full"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
            useStore.getState().resetForLogout();
            router.push("/login");
          }}
        >
          Log out
        </button>
      </form>
        </>
      )}

      {tab === "preview" && (
        <section className="card mx-auto mt-4 max-w-xl p-5 sm:mt-6 sm:p-6">
          <h2 className="card-title">Profile preview</h2>
          <p className="mt-1 text-sm text-sub">This is how people click through your photos.</p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-line/60 bg-surface2">
            <div className="relative aspect-[4/5]">
              {photoUrls[previewIndex] ? (
                <img src={photoUrls[previewIndex]} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted">Add photos to preview</div>
              )}
              <div className="absolute inset-x-3 top-3 flex gap-1.5">
                {(photoUrls.length ? photoUrls : [0]).map((_, i) => (
                  <span
                    key={`bar-${i}`}
                    className={`h-1 flex-1 rounded-full ${i === previewIndex ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white">
                <p className="text-lg font-semibold">{name || me.name}</p>
                <p className="text-sm text-white/85">{city || me.city}</p>
                <p className="mt-1 line-clamp-2 text-xs text-white/80">{bio || me.bio}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-line/60 p-3">
              <button
                type="button"
                className="btn-ghost w-full"
                onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                disabled={previewIndex <= 0}
              >
                Previous photo
              </button>
              <button
                type="button"
                className="pill-grad w-full py-2.5 text-sm"
                onClick={() => setPreviewIndex((i) => Math.min(Math.max(0, photoUrls.length - 1), i + 1))}
                disabled={photoUrls.length === 0 || previewIndex >= photoUrls.length - 1}
              >
                Next photo
              </button>
            </div>
          </div>
        </section>
      )}

      <BottomNav />
    </main>
  );
}
