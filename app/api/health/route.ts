import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, database: "error", message }, { status: 503 });
  }
}
