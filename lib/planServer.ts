import { prisma } from "@/lib/prisma";

export type DbPlan = "explorer" | "plus" | "premium" | "elite";

export async function getUserPlan(userId: string): Promise<DbPlan> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ["active", "trialing"] } },
    orderBy: { startedAt: "desc" },
    select: { plan: true }
  });
  const p = sub?.plan;
  if (p === "plus" || p === "premium" || p === "elite") return p;
  return "explorer";
}
