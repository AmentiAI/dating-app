import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/serverAuth";

const allowedPlans = new Set(["explorer", "plus", "premium", "elite"]);

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { plan } = (await req.json()) as { plan?: string };
    if (!plan || !allowedPlans.has(plan)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    if (plan === "explorer") {
      await prisma.subscription.deleteMany({
        where: { userId: session.uid, status: { in: ["active", "trialing"] } }
      });
      return NextResponse.json({ ok: true });
    }

    const existing = await prisma.subscription.findFirst({
      where: { userId: session.uid, status: { in: ["active", "trialing"] } },
      select: { id: true }
    });
    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          plan,
          status: "active",
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        }
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: session.uid,
          stripeCustomerId: `local-customer-${session.uid}`,
          stripeSubscriptionId: `local-${session.uid}`,
          plan,
          status: "active",
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Plan update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
