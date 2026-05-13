"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMessage(data.message ?? "Check your email for next steps.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-ink sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <Link href="/login" className="text-sm text-sub hover:text-ink">
          ← Back to log in
        </Link>
        <section className="card mt-6 p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold">Forgot password</h1>
          <p className="mt-2 text-sm text-sub">
            Enter your email and we&apos;ll send a reset link if an account exists. In development, the link may be
            printed in the server console unless{" "}
            <span className="font-mono text-xs text-ink">RESEND_API_KEY</span> is set.
          </p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-sub">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
                autoComplete="email"
              />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            {message && <p className="text-sm text-sub">{message}</p>}
            <button type="submit" disabled={loading} className="pill-grad w-full disabled:opacity-60">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
