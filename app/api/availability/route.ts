import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/availability?weekStart=YYYY-MM-DD
 * Returns all blocks that touch that week.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const weekStartParam = searchParams.get("weekStart");
  if (!weekStartParam) {
    return NextResponse.json({ error: "Missing weekStart" }, { status: 400 });
  }

  const weekStart = new Date(weekStartParam);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      start: { lt: weekEnd },
      end: { gt: weekStart },
    },
    include: { user: true },
    orderBy: { start: "asc" },
  });

  return NextResponse.json({
    blocks: blocks.map((b) => ({
      id: b.id,
      userId: b.userId,
      userName: b.user.name,
      start: b.start,
      end: b.end,
    })),
  });
}

/**
 * POST /api/availability
 * body: { start: string, end: string }
 * Creates / replaces blocks for the current user in that range.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.start || !body?.end) {
    return NextResponse.json({ error: "Missing start or end" }, { status: 400 });
  }

  const start = new Date(body.start);
  const end = new Date(body.end);
  if (!(start < end)) {
    return NextResponse.json({ error: "End must be after start" }, { status: 400 });
  }

  await prisma.availabilityBlock.deleteMany({
    where: {
      userId: user.id,
      start: { lt: end },
      end: { gt: start },
    },
  });

  const block = await prisma.availabilityBlock.create({
    data: {
      userId: user.id,
      start,
      end,
    },
  });

  return NextResponse.json({ id: block.id });
}

/**
 * DELETE /api/availability
 * body: { start: string, end: string }
 * Clears any blocks for the current user overlapping that window.
 */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.start || !body?.end) {
    return NextResponse.json({ error: "Missing start or end" }, { status: 400 });
  }

  const start = new Date(body.start);
  const end = new Date(body.end);
  if (!(start < end)) {
    return NextResponse.json({ error: "End must be after start" }, { status: 400 });
  }

  await prisma.availabilityBlock.deleteMany({
    where: {
      userId: user.id,
      start: { lt: end },
      end: { gt: start },
    },
  });

  return NextResponse.json({ ok: true });
}
