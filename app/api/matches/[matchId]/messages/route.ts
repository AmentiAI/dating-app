import { NextResponse } from "next/server";
import { getOrCreateConversationForMatch } from "@/lib/matchConversation";
import { isDbMatchId } from "@/lib/matchIds";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/serverAuth";
import type { ChatMessage } from "@/lib/types";

const MAX_LEN = 4000;

async function assertMatchMember(matchId: string, uid: string): Promise<boolean> {
  const m = await prisma.match.findFirst({
    where: {
      id: matchId,
      isActive: true,
      OR: [{ user1Id: uid }, { user2Id: uid }]
    },
    select: { id: true }
  });
  return !!m;
}

function mapRow(row: { id: string; senderId: string; message: string | null; createdAt: Date }, viewerId: string): ChatMessage {
  return {
    id: row.id,
    role: row.senderId === viewerId ? "me" : "them",
    text: row.message ?? "",
    ts: row.createdAt.toISOString()
  };
}

export async function GET(_req: Request, context: { params: Promise<{ matchId: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId } = await context.params;
  if (!isDbMatchId(matchId)) {
    return NextResponse.json({ error: "Invalid match." }, { status: 400 });
  }

  const ok = await assertMatchMember(matchId, session.uid);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const conv = await prisma.conversation.findUnique({
    where: { matchId },
    select: { id: true }
  });
  if (!conv) {
    return NextResponse.json({ messages: [] as ChatMessage[] });
  }

  const rows = await prisma.message.findMany({
    where: { conversationId: conv.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, senderId: true, message: true, createdAt: true }
  });

  const messages = rows.map((r) => mapRow(r, session.uid));
  return NextResponse.json({ messages });
}

export async function POST(req: Request, context: { params: Promise<{ matchId: string }> }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId } = await context.params;
  if (!isDbMatchId(matchId)) {
    return NextResponse.json({ error: "Invalid match." }, { status: 400 });
  }

  const ok = await assertMatchMember(matchId, session.uid);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: { text?: string };
  try {
    body = (await req.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Message text required." }, { status: 400 });
  if (text.length > MAX_LEN) {
    return NextResponse.json({ error: `Message too long (max ${MAX_LEN} characters).` }, { status: 400 });
  }

  const conversationId = await getOrCreateConversationForMatch(matchId);
  if (!conversationId) {
    return NextResponse.json({ error: "Could not open conversation." }, { status: 500 });
  }

  const row = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.uid,
      message: text
    },
    select: { id: true, senderId: true, message: true, createdAt: true }
  });

  const message = mapRow(row, session.uid);
  return NextResponse.json({ message });
}
