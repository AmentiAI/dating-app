import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMatchingEligibility } from "@/lib/requireMatchingEligibility";
import { requireSession } from "@/lib/serverAuth";

type PurchaseBody = {
  itemKey?: string;
  amountCents?: number;
};

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await requireMatchingEligibility(session.uid);
  if (blocked) return blocked;

  try {
    const body = (await req.json()) as PurchaseBody;
    const itemKey = (body.itemKey ?? "").trim();
    const amountCents = Number(body.amountCents ?? 0);

    if (!itemKey || !Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: "Invalid purchase payload." }, { status: 400 });
    }

    await prisma.oneTimePurchase.create({
      data: {
        userId: session.uid,
        itemKey,
        amountCents
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
