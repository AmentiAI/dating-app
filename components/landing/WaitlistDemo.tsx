"use client";

import { useState } from "react";

export function WaitlistDemo() {
  const [done, setDone] = useState(false);

  return (
    <div className="rounded-3xl border border-line/60 bg-surface p-7">
      <p className="text-base font-semibold text-ink">Dating app access</p>
      <p className="mt-2 text-base text-sub">
        Get account access updates and new match features as we keep improving the dating experience.
      </p>
      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
      >
        <input
          type="email"
          required
          disabled={done}
          placeholder="you@domain.com"
          className="w-full rounded-2xl border border-line bg-bg px-4 py-3.5 text-base text-ink outline-none ring-accent2/30 placeholder:text-muted focus:ring-2 disabled:opacity-60"
        />
        <button type="submit" disabled={done} className="pill-grad w-full shrink-0 sm:w-auto sm:px-6 disabled:opacity-60">
          {done ? "You’re in" : "Join"}
        </button>
      </form>
      <p className="mt-3 text-xs text-muted">
        {done ? "You’re in — we’ll email you dating app updates." : "We only send important dating app updates."}
      </p>
    </div>
  );
}
