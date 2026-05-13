import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/isAdmin";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/serverAuth";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminUser(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, source: true, createdAt: true }
  });

  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = ["email,source,created_at"];
  for (const r of rows) {
    lines.push(`${esc(r.email)},${esc(r.source ?? "")},${r.createdAt.toISOString()}`);
  }
  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="waitlist.csv"'
    }
  });
}
