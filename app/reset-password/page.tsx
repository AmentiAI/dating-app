"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (!token) {
      setError("Missing reset token. Open the link from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Reset failed.");
        return;
      }
      router.replace("/login");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card mt-6 p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold">New password</h1>
      <p className="mt-2 text-sm text-sub">Choose a strong password for your account.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-sub">New password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-sub">Confirm</span>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
            autoComplete="new-password"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading || !token} className="pill-grad w-full disabled:opacity-60">
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-ink sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <Link href="/login" className="text-sm text-sub hover:text-ink">
          ← Back to log in
        </Link>
        <Suspense
          fallback={
            <p className="card mt-6 p-6 text-sm text-sub" suppressHydrationWarning>
              Loading…
            </p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
