"use client";

import { useState } from "react";

export function WaitlistDemo() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-3xl border border-line/60 bg-surface p-7">
      <p className="text-base font-semibold text-ink">Dating app access</p>
      <p className="mt-2 text-base text-sub">
        Get account access updates and new match features as we keep improving the dating experience.
      </p>
      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setSaving(true);
          try {
            const res = await fetch("/api/waitlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: email.trim(), source: "landing" })
            });
            const data = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok) {
              setError(typeof data.error === "string" ? data.error : "Something went wrong.");
              return;
            }
            setDone(true);
          } catch {
            setError("Network error. Try again.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={done || saving}
          placeholder="you@domain.com"
          className="w-full rounded-2xl border border-line bg-bg px-4 py-3.5 text-base text-ink outline-none ring-accent2/30 placeholder:text-muted focus:ring-2 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={done || saving}
          className="pill-grad w-full shrink-0 sm:w-auto sm:px-6 disabled:opacity-60"
        >
          {saving ? "Joining…" : done ? "You’re in" : "Join"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <p className="mt-3 text-xs text-muted">
        {done
          ? "You’re on the list — we’ll only email important product updates."
          : "We only send important dating app updates."}
      </p>
    </div>
  );
}
