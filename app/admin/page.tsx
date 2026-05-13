import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/isAdmin";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireSession();
  if (!session) redirect("/login");
  if (!isAdminUser(session)) redirect("/");

  const [users, waitlist, waitlistTotal] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        authCredential: { select: { id: true } }
      }
    }),
    prisma.waitlistEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, email: true, source: true, createdAt: true }
    }),
    prisma.waitlistEntry.count()
  ]);

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-ink">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-sub">Admin</p>
            <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-muted">
              Production access requires <code className="text-sub">ADMIN_EMAILS</code> or{" "}
              <code className="text-sub">ADMIN_USER_IDS</code> in the environment.
            </p>
          </div>
          <Link href="/" className="btn-ghost">
            Home
          </Link>
        </header>

        <section className="mb-10">
          <h2 className="mb-3 font-display text-xl font-semibold">
            Landing waitlist
            <span className="ml-2 text-base font-normal text-muted">({waitlistTotal} total)</span>
          </h2>
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[1.2fr_0.6fr_0.9fr] gap-3 border-b border-line/60 bg-surface2/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
              <span>Email</span>
              <span>Source</span>
              <span>Signed up</span>
            </div>
            {waitlist.length === 0 ? (
              <p className="p-6 text-base text-sub">No waitlist signups yet.</p>
            ) : (
              waitlist.map((w) => (
                <div
                  key={w.id}
                  className="grid gap-2 border-b border-line/40 px-4 py-3 text-sm sm:grid-cols-[1.2fr_0.6fr_0.9fr] sm:gap-3"
                >
                  <span className="truncate">
                    <span className="mr-2 text-xs text-muted sm:hidden">Email:</span>
                    {w.email}
                  </span>
                  <span>
                    <span className="mr-2 text-xs text-muted sm:hidden">Source:</span>
                    {w.source ?? "—"}
                  </span>
                  <span>
                    <span className="mr-2 text-xs text-muted sm:hidden">Signed up:</span>
                    {new Date(w.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <h2 className="mb-3 font-display text-xl font-semibold">Registered accounts</h2>
        <section className="card overflow-hidden">
          <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr] gap-3 border-b border-line/60 bg-surface2/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
            <span>Email</span>
            <span>Username</span>
            <span>Password</span>
            <span>Created</span>
          </div>

          {users.length === 0 ? (
            <p className="p-6 text-base text-sub">No users yet.</p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="grid gap-2 border-b border-line/40 px-4 py-3 text-sm sm:grid-cols-[1.2fr_1fr_0.8fr_0.8fr] sm:gap-3"
              >
                <span className="truncate"><span className="mr-2 text-xs text-muted sm:hidden">Email:</span>{u.email}</span>
                <span className="truncate"><span className="mr-2 text-xs text-muted sm:hidden">Username:</span>{u.username}</span>
                <span><span className="mr-2 text-xs text-muted sm:hidden">Password:</span>{u.authCredential ? "Set" : "Missing"}</span>
                <span><span className="mr-2 text-xs text-muted sm:hidden">Created:</span>{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
