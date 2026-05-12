"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toProxyPhotoUrl } from "@/lib/media";
import type { Intent } from "@/lib/types";
import { useStore } from "@/lib/store";

const TOTAL = 11;

const lifestyleKeys = [
  "Smoking",
  "Drinking",
  "Fitness",
  "Religion",
  "Politics",
  "Education",
  "Kids",
  "Pets"
] as const;

const hobbyPool = [
  "Photography",
  "Cooking",
  "Hiking",
  "Reading",
  "Live music",
  "Climbing",
  "Travel",
  "Gaming",
  "Running",
  "Art museums",
  "Wine",
  "Volunteering"
];

const dealbreakerPool = [
  "Smoking",
  "Long distance",
  "Intentions mismatch",
  "Wants kids",
  "Inactive lifestyle",
  "Heavy drinking",
  "Politics",
  "Religion"
];

const racePool = ["Asian", "Black", "Latino", "Middle Eastern", "White", "South Asian", "Mixed", "Other"];

function formatFeetInches(totalInches: number): string {
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return `${ft}'${inch}"`;
}

function intentToMeIntent(v: string): Intent {
  const map: Record<string, Intent> = {
    long: "long-term",
    marriage: "marriage",
    casual: "casual",
    friends: "friends",
    network: "friends"
  };
  return map[v] ?? "long-term";
}

export function OnboardingFlow() {
  const router = useRouter();
  const updateMe = useStore((s) => s.updateMe);
  const me = useStore((s) => s.me);

  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<string | null>(null);
  const [interested, setInterested] = useState<string[]>([]);
  const [intent, setIntent] = useState<string | null>(null);
  const [minAge, setMinAge] = useState(24);
  const [maxAge, setMaxAge] = useState(36);
  const [minH, setMinH] = useState(64);
  const [maxH, setMaxH] = useState(74);
  const [minWeight, setMinWeight] = useState(110);
  const [maxWeight, setMaxWeight] = useState(220);
  const [preferredRaces, setPreferredRaces] = useState<string[]>([]);
  const [life, setLife] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(lifestyleKeys.map((k) => [k, false]))
  );
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [personality, setPersonality] = useState<string | null>(null);
  const [social, setSocial] = useState<string | null>(null);
  const [travel, setTravel] = useState<string | null>(null);
  const [fitness, setFitness] = useState<string | null>(null);
  const [gaming, setGaming] = useState<string | null>(null);
  const [music, setMusic] = useState<string | null>(null);
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [weekend, setWeekend] = useState("");

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return !!gender;
      case 3:
        return interested.length > 0;
      case 4:
        return !!intent;
      case 5:
        return minAge <= maxAge;
      case 6:
        return minH <= maxH;
      case 7:
        return minWeight <= maxWeight;
      case 8:
        return hobbies.length >= 2 && !!personality && !!social;
      case 9:
        return true;
      case 10:
        return photos.length >= 2;
      case 11:
        return bio.trim().length >= 24;
      default:
        return false;
    }
  }, [
    step,
    gender,
    interested,
    intent,
    minAge,
    maxAge,
    minH,
    maxH,
    minWeight,
    maxWeight,
    hobbies,
    personality,
    social,
    photos,
    bio
  ]);

  function toggle<T extends string>(list: T[], v: T, set: (n: T[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  function finish() {
    if (!intent) return;
    updateMe({
      onboarded: true,
      intent: intentToMeIntent(intent),
      bio: bio.trim() || me.bio,
      dealbreakers,
      interests: hobbies.length ? hobbies : me.interests,
      filters: {
        ...me.filters,
        ageRange: [minAge, maxAge],
        heightRange: [minH, maxH],
        weightRange: [minWeight, maxWeight],
        preferredRaces
      },
      prompts: [
        { q: "My perfect weekend", a: weekend.trim() || "Low plans, high presence." },
        { q: "What I value most", a: "Honesty, chemistry, and follow-through." },
        ...me.prompts.slice(2)
      ],
      media:
        photos.length > 0
          ? photos.map((url) => ({ kind: "photo" as const, url: toProxyPhotoUrl(url) }))
          : me.media
    });
    router.push("/discover");
  }

  async function uploadSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const picked = Array.from(files).slice(0, 6);
      const urls: string[] = [];

      for (const file of picked) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        const json = (await res.json()) as { viewUrl?: string; url?: string; error?: string };
        if (!res.ok || (!json.viewUrl && !json.url)) {
          throw new Error(json.error ?? "Image upload failed.");
        }
        urls.push(toProxyPhotoUrl(json.viewUrl ?? json.url!));
      }

      setPhotos((prev) => [...prev, ...urls].slice(0, 6));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-bg px-4 pb-36 pt-6 sm:px-5 sm:pb-28 sm:pt-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-accent2/15 to-transparent blur-2xl" />
      <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
        <div className="flex items-center gap-2">
          <Image
            src="/preference-plus-logo.png"
            alt="Preference Plus"
            width={28}
            height={28}
            className="rounded-md border border-line/70 bg-white/75"
          />
          <Link href="/" className="text-sm text-sub hover:text-ink">
            Home
          </Link>
        </div>
        <p className="rounded-full border border-line/70 bg-surface/70 px-3 py-1 text-xs text-muted">
          Step {step}/{TOTAL}
        </p>
      </header>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent via-accent2 to-accent3 transition-all duration-300"
          style={{ width: `${(step / TOTAL) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="card relative border-line/60 p-5 pb-12 sm:p-7 sm:pb-12"
        >
          {step === 1 && (
            <div>
              <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Find people who actually fit what you&apos;re looking for.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-sub sm:text-xl">
                Preference Plus helps you find genuine mutual fit. Your preferences stay private, while
                compatibility remains clear, intentional, and easy to trust.
              </p>
              <div className="mt-10 flex justify-center sm:mt-20">
                <Image
                  src="/preference-plus-logo.png"
                  alt="Preference Plus logo"
                  width={460}
                  height={460}
                  className="h-auto w-full max-w-[290px] rounded-2xl border border-line/70 bg-white/80 p-2 shadow-card sm:max-w-[500px]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-3xl font-semibold">Gender identity</h2>
              <p className="mt-2 text-base text-sub">Choose what feels most accurate.</p>
              <div className="mt-6 grid gap-3">
                {["Male", "Female", "Non-binary", "Other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`rounded-2xl border px-5 py-5 text-left text-base font-medium transition ${
                      gender === g
                        ? "border-accent2/60 bg-accent2/15 text-ink"
                        : "border-line bg-surface hover:border-white/20"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-3xl font-semibold">Interested in</h2>
              <p className="mt-2 text-base text-sub">Who should we show you?</p>
              <div className="mt-6 grid gap-3">
                {["Men", "Women", "Everyone"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggle(interested, g, setInterested)}
                    className={`rounded-2xl border px-5 py-5 text-left text-base font-medium transition ${
                      interested.includes(g)
                        ? "border-accent/60 bg-accent/15 text-ink"
                        : "border-line bg-surface hover:border-white/20"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-display text-2xl font-semibold">Relationship intent</h2>
              <p className="mt-2 text-sm text-sub">What are you optimizing for right now?</p>
              <div className="mt-6 grid gap-3">
                {[
                  { id: "long", label: "Long-term" },
                  { id: "marriage", label: "Marriage" },
                  { id: "casual", label: "Casual" },
                  { id: "friends", label: "Friendship" },
                  { id: "network", label: "Networking" }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setIntent(g.id)}
                    className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                      intent === g.id
                        ? "border-accent3/60 bg-accent3/15 text-ink"
                        : "border-line bg-surface hover:border-white/20"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="font-display text-2xl font-semibold">Age preferences</h2>
              <p className="mt-2 text-sm text-sub">Set the age range you want to match with.</p>
              <div className="mt-8 space-y-8">
                <label className="block text-sm text-sub">
                  Min age: <span className="font-semibold text-ink">{minAge}</span>
                  <input
                    type="range"
                    min={18}
                    max={80}
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="mt-3 w-full accent-accent2"
                  />
                </label>
                <label className="block text-sm text-sub">
                  Max age: <span className="font-semibold text-ink">{maxAge}</span>
                  <input
                    type="range"
                    min={18}
                    max={80}
                    value={maxAge}
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                    className="mt-3 w-full accent-accent2"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="font-display text-2xl font-semibold">Height preferences</h2>
              <p className="mt-2 text-sm text-sub">Use feet and inches.</p>
              <div className="mt-8 space-y-8">
                <label className="block text-sm text-sub">
                  Min height: <span className="font-semibold text-ink">{formatFeetInches(minH)}</span>
                  <input
                    type="range"
                    min={48}
                    max={84}
                    value={minH}
                    onChange={(e) => setMinH(Number(e.target.value))}
                    className="mt-3 w-full accent-accent2"
                  />
                </label>
                <label className="block text-sm text-sub">
                  Max height: <span className="font-semibold text-ink">{formatFeetInches(maxH)}</span>
                  <input
                    type="range"
                    min={48}
                    max={84}
                    value={maxH}
                    onChange={(e) => setMaxH(Number(e.target.value))}
                    className="mt-3 w-full accent-accent2"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <h2 className="font-display text-2xl font-semibold">Lifestyle preferences</h2>
              <p className="mt-2 text-sm text-sub">
                Toggle what you want surfaced in compatibility, then set race and weight preferences.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {lifestyleKeys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setLife((s) => ({ ...s, [k]: !s[k] }))}
                    className={`rounded-full border px-4 py-2 text-xs font-medium ${
                      life[k] ? "border-accent2/60 bg-accent2/20 text-ink" : "border-line bg-surface text-sub"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="mt-7 space-y-8 rounded-2xl border border-line/60 bg-surface/40 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Weight preference (lb)</p>
                  <div className="mt-3 space-y-5">
                    <label className="block text-sm text-sub">
                      Min: <span className="font-semibold text-ink">{minWeight} lb</span>
                      <input
                        type="range"
                        min={80}
                        max={350}
                        value={minWeight}
                        onChange={(e) => setMinWeight(Number(e.target.value))}
                        className="mt-2 w-full accent-accent2"
                      />
                    </label>
                    <label className="block text-sm text-sub">
                      Max: <span className="font-semibold text-ink">{maxWeight} lb</span>
                      <input
                        type="range"
                        min={80}
                        max={350}
                        value={maxWeight}
                        onChange={(e) => setMaxWeight(Number(e.target.value))}
                        className="mt-2 w-full accent-accent2"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Race preference</p>
                  <p className="mt-1 text-xs text-muted">Optional. Leave blank to keep this open.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {racePool.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggle(preferredRaces, r, setPreferredRaces)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          preferredRaces.includes(r)
                            ? "border-accent3/60 bg-accent3/15 text-ink"
                            : "border-line bg-surface text-sub"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 8 && (
            <div>
              <h2 className="font-display text-2xl font-semibold">Personality & interests</h2>
              <p className="mt-2 text-sm text-sub">Pick at least two hobbies, then answer the quick fields.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {hobbyPool.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggle(hobbies, h, setHobbies)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      hobbies.includes(h) ? "border-accent/60 bg-accent/15 text-ink" : "border-line bg-surface text-sub"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <div className="mt-6 grid gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Personality type</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Bold", "Soft", "Analytical", "Chaotic good"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setPersonality(o)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          personality === o ? "border-accent3/60 bg-accent3/15 text-ink" : "border-line bg-surface text-sub"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Social energy</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Homebody", "Balanced", "Outgoing", "Depends"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setSocial(o)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          social === o ? "border-accent3/60 bg-accent3/15 text-ink" : "border-line bg-surface text-sub"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Travel</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Weekend trips", "Slow travel", "Passport ready", "Rarely"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setTravel(o)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          travel === o ? "border-accent3/60 bg-accent3/15 text-ink" : "border-line bg-surface text-sub"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Fitness</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Daily", "Weekly", "Light walks", "N/A"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setFitness(o)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          fitness === o ? "border-accent3/60 bg-accent3/15 text-ink" : "border-line bg-surface text-sub"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Gaming</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Often", "Casual", "Co-op only", "Not really"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setGaming(o)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          gaming === o ? "border-accent3/60 bg-accent3/15 text-ink" : "border-line bg-surface text-sub"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Music</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Concerts", "Headphones life", "Instrumentalist", "Eclectic"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setMusic(o)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          music === o ? "border-accent3/60 bg-accent3/15 text-ink" : "border-line bg-surface text-sub"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 9 && (
            <div>
              <h2 className="font-display text-2xl font-semibold">Dealbreakers</h2>
              <p className="mt-2 text-sm text-sub">These stay private — we only use them to filter bad fits.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {dealbreakerPool.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggle(dealbreakers, d, setDealbreakers)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      dealbreakers.includes(d) ? "border-gold/50 bg-gold/10 text-ink" : "border-line bg-surface text-sub"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 10 && (
            <div>
              <h2 className="font-display text-2xl font-semibold">Photos</h2>
              <p className="mt-2 text-sm text-sub">
                Upload real photos from your device. Stored in Vercel Blob and shown on your profile.
              </p>
              <label className="mt-6 block w-full rounded-2xl border border-dashed border-line/80 bg-surface px-4 py-4 text-center text-sm font-medium text-sub hover:border-accent2/60 hover:text-ink">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => void uploadSelected(e.target.files)}
                />
                {uploading ? "Uploading photos..." : "Select photos from camera roll"}
              </label>
              <div className="mt-3 flex items-center justify-end">
                <p className="text-xs text-muted">{photos.length}/6 uploaded</p>
              </div>
              {uploadError && (
                <p className="mt-2 rounded-xl border border-red-300/50 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {uploadError}
                </p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {photos.map((u) => (
                  <div key={u} className="relative aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-white/10">
                    {/* Use native img so private Blob download URLs render reliably */}
                    <img src={u} alt="Uploaded profile" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 11 && (
            <div>
              <h2 className="font-display text-2xl font-semibold">Bio & prompts</h2>
              <p className="mt-2 text-sm text-sub">Write like a human. Specific beats generic.</p>
              <label className="mt-6 block text-sm text-sub">
                Bio (min 24 characters)
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-ink outline-none ring-accent2/30 focus:ring-2"
                  placeholder="What you want, what you bring, what a great date feels like."
                />
              </label>
              <label className="mt-4 block text-sm text-sub">
                My perfect weekend
                <input
                  value={weekend}
                  onChange={(e) => setWeekend(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-ink outline-none ring-accent2/30 focus:ring-2"
                  placeholder="Small rituals, big feelings."
                />
              </label>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="safe-bottom fixed bottom-0 left-0 right-0 border-t border-line/60 bg-bg/95 px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
        <div className="mx-auto flex max-w-lg gap-3">
          <button
            type="button"
            className="btn-ghost flex-1 py-3"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Back
          </button>
          {step < TOTAL ? (
            <button
              type="button"
              className="pill-grad flex-[2] py-3"
              disabled={!canNext}
              onClick={() => setStep((s) => Math.min(TOTAL, s + 1))}
            >
              Continue
            </button>
          ) : (
            <button type="button" className="pill-grad flex-[2] py-3" disabled={!canNext} onClick={finish}>
              Finish & enter feed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
