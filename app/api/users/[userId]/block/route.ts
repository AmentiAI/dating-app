import { NextResponse } from "next/server";
import { isDbMatchId } from "@/lib/matchIds";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/serverAuth";

export async function POST(_req: Request, context: { params: Promise<{ userId: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await context.params;
  if (!isDbMatchId(userId)) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }
  if (userId === session.uid) {
    return NextResponse.json({ error: "Invalid target." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true }
  });
  if (!target || target.deletedAt) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    await prisma.block.create({
      data: { blockerId: session.uid, blockedId: userId }
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code: string }).code) : "";
    if (code !== "P2002") {
      const message = e instanceof Error ? e.message : "Block failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  await prisma.match.updateMany({
    where: {
      isActive: true,
      OR: [
        { user1Id: session.uid, user2Id: userId },
        { user1Id: userId, user2Id: session.uid }
      ]
    },
    data: { isActive: false }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: { params: Promise<{ userId: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await context.params;
  if (!isDbMatchId(userId)) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }

  await prisma.block.deleteMany({
    where: { blockerId: session.uid, blockedId: userId }
  });

  return NextResponse.json({ ok: true });
}
