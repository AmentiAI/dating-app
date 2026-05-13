import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { clientKeyFromHeaders } from "@/lib/clientKey";
import { prisma } from "@/lib/prisma";
import { slidingWindowAllow } from "@/lib/slidingRateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const h = await headers();
  if (!slidingWindowAllow(`waitlist:${clientKeyFromHeaders(h)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  let body: { email?: string; source?: string };
  try {
    body = (await req.json()) as { email?: string; source?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = (body.email ?? "").trim().toLowerCase();
  if (!raw || raw.length > 254 || !EMAIL_RE.test(raw)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const source = (body.source ?? "landing").trim().slice(0, 64) || "landing";

  try {
    await prisma.waitlistEntry.create({
      data: { email: raw, source }
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    const message = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
