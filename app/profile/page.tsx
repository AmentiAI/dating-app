"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const photoUrls = useMemo(
    () => me.media.filter((m) => m.kind === "photo").map((m) => m.url),
    [me.media]
  );

  useEffect(() => {
    setName(me.name);
    setCity(me.city);
    setBio(me.bio);
    setIntent(me.intent);
    setInterests(me.interests.join(", "));
    setPreviewIndex(0);
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

  function setPhotos(nextUrls: string[]) {
    updateMe({
      media: [
        ...nextUrls.map((url) => ({ kind: "photo" as const, url })),
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
        uploaded.push(json.viewUrl ?? json.url!);
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

  return (
    <main className="min-h-screen bg-bg px-4 pb-28 pt-4 text-ink sm:pt-5">
      <header className="mx-auto w-full max-w-xl">
        <h1 className="font-display text-2xl font-semibold">Edit Profile</h1>
      </header>

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
