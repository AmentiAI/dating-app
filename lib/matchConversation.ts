import { prisma } from "@/lib/prisma";

/** Returns conversation id for this match, creating row + participants if needed. */
export async function getOrCreateConversationForMatch(matchId: string): Promise<string | null> {
  const existing = await prisma.conversation.findUnique({
    where: { matchId },
    select: { id: true }
  });
  if (existing) return existing.id;

  const match = await prisma.match.findFirst({
    where: { id: matchId, isActive: true },
    select: { user1Id: true, user2Id: true }
  });
  if (!match) return null;

  const conv = await prisma.conversation.create({
    data: {
      matchId,
      participants: {
        create: [{ userId: match.user1Id }, { userId: match.user2Id }]
      }
    },
    select: { id: true }
  });
  return conv.id;
}
