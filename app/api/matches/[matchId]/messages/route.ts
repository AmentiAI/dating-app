import { NextResponse } from "next/server";
import { isBlockBetween } from "@/lib/blockedUserIds";
import { getOrCreateConversationForMatch } from "@/lib/matchConversation";
import { isDbMatchId } from "@/lib/matchIds";
import { prisma } from "@/lib/prisma";
import { requireMatchingEligibility } from "@/lib/requireMatchingEligibility";
import { requireSession } from "@/lib/serverAuth";
import type { ChatMessage } from "@/lib/types";

const MAX_LEN = 4000;

/** Membership + block + active check. Returns an error response or null if OK to proceed. */
async function assertMessagesGate(matchId: string, uid: string): Promise<NextResponse | null> {
  const row = await prisma.match.findFirst({
    where: { id: matchId, OR: [{ user1Id: uid }, { user2Id: uid }] },
    select: { user1Id: true, user2Id: true, isActive: true }
  });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const otherId = row.user1Id === uid ? row.user2Id : row.user1Id;
  if (await isBlockBetween(uid, otherId)) return blockedConversationResponse();
  if (!row.isActive) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return null;
}

function blockedConversationResponse() {
  return NextResponse.json(
    { error: "This conversation is not available.", code: "blocked" as const },
    { status: 403 }
  );
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

  const eligibility = await requireMatchingEligibility(session.uid);
  if (eligibility) return eligibility;

  const { matchId } = await context.params;
  if (!isDbMatchId(matchId)) {
    return NextResponse.json({ error: "Invalid match." }, { status: 400 });
  }

  const deny = await assertMessagesGate(matchId, session.uid);
  if (deny) return deny;

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

  const eligibility = await requireMatchingEligibility(session.uid);
  if (eligibility) return eligibility;

  const { matchId } = await context.params;
  if (!isDbMatchId(matchId)) {
    return NextResponse.json({ error: "Invalid match." }, { status: 400 });
  }

  const deny = await assertMessagesGate(matchId, session.uid);
  if (deny) return deny;

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
