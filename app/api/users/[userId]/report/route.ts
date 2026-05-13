import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { clientKeyFromHeaders } from "@/lib/clientKey";
import { isDbMatchId } from "@/lib/matchIds";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/serverAuth";
import { slidingWindowAllow } from "@/lib/slidingRateLimit";

export async function POST(req: Request, context: { params: Promise<{ userId: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const h = await headers();
  const ip = clientKeyFromHeaders(h);
  if (!slidingWindowAllow(`report:${ip}`, 15, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429 });
  }

  const { userId } = await context.params;
  if (!isDbMatchId(userId)) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }
  if (userId === session.uid) {
    return NextResponse.json({ error: "Invalid target." }, { status: 400 });
  }

  let body: { reason?: string; details?: string };
  try {
    body = (await req.json()) as { reason?: string; details?: string };
  } catch {
    body = {};
  }

  const reason = (body.reason ?? "unspecified").trim().slice(0, 120) || "unspecified";
  const details = (body.details ?? "").trim().slice(0, 2000) || null;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true }
  });
  if (!target || target.deletedAt) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await prisma.report.create({
    data: {
      reporterId: session.uid,
      reportedUserId: userId,
      reason,
      details,
      status: "pending"
    }
  });

  return NextResponse.json({ ok: true });
}
