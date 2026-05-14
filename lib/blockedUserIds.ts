import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** User IDs the viewer never wants to see (either side of a block). */
export async function getBlockedUserIds(
  viewerId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma
): Promise<Set<string>> {
  const rows = await db.block.findMany({
    where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
    select: { blockerId: true, blockedId: true }
  });
  const out = new Set<string>();
  for (const r of rows) {
    out.add(r.blockerId === viewerId ? r.blockedId : r.blockerId);
  }
  return out;
}

/** True if either user has blocked the other (symmetric). */
export async function isBlockBetween(
  a: string,
  b: string,
  db: Prisma.TransactionClient | typeof prisma = prisma
): Promise<boolean> {
  const row = await db.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a }
      ]
    },
    select: { blockerId: true }
  });
  return !!row;
}
