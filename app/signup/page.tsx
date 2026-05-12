"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
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
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password })
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Signup failed.");
      }
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-6 text-ink sm:py-8">
      <div className="mx-auto w-full max-w-xl">
        <Link href="/" className="text-sm text-sub hover:text-ink">
          ← Back home
        </Link>

        <section className="card mt-4 p-6 sm:p-8">
          <h1 className="font-display text-3xl font-semibold">Create your account</h1>
          <p className="mt-2 text-base text-sub">
            Sign up with email and password to save your profile and continue onboarding.
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
                placeholder="you@email.com"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-sub">Username</span>
              <input
                type="text"
                required
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
                placeholder="preferenceplusfan"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-sub">Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
                placeholder="At least 8 characters"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-sub">Confirm password</span>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-base outline-none ring-accent2/30 focus:ring-2"
                placeholder="Repeat password"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="pill-grad w-full disabled:opacity-60">
              {loading ? "Creating account..." : "Sign up"}
            </button>
            <p className="text-center text-sm text-sub">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-accent3 hover:text-accent">
                Log in
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
