import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay(); // 0 = Sun
  x.setDate(x.getDate() - dow);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

// GET: return all availability blocks for the requested week
export async function GET(req: Request) {
  const prisma = getPrisma();

  const url = new URL(req.url);
  const weekStartParam = url.searchParams.get("weekStart");

  const base = weekStartParam ? new Date(weekStartParam) : startOfWeek(new Date());
  const weekStart = startOfWeek(base);
  const weekEnd = addDays(weekStart, 7);

  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      OR: [
        {
          start: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        {
          end: {
            gt: weekStart,
            lte: weekEnd,
          },
        },
        {
          start: {
            lte: weekStart,
          },
          end: {
            gte: weekEnd,
          },
        },
      ],
    },
    include: {
      user: true,
    },
    orderBy: {
      start: "asc",
    },
  });

  return NextResponse.json({
    blocks: blocks.map((b) => ({
      id: b.id,
      userId: b.userId,
      userName: b.user.name,
      start: b.start.toISOString(),
      end: b.end.toISOString(),
    })),
  });
}

// POST: add a new availability block for the current user
export async function POST(req: Request) {
  const prisma = getPrisma();
  const current = await getCurrentUser();

  if (!current) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  if (!body?.start || !body?.end) {
    return NextResponse.json(
      { error: "Missing start or end time" },
      { status: 400 },
    );
  }

  const start = new Date(body.start);
  const end = new Date(body.end);

  if (!(end > start)) {
    return NextResponse.json(
      { error: "End must be after start" },
      { status: 400 },
    );
  }

  const block = await prisma.availabilityBlock.create({
    data: {
      userId: current.id,
      start,
      end,
    },
    include: {
      user: true,
    },
  });

  return NextResponse.json({
    id: block.id,
    userId: block.userId,
    userName: block.user.name,
    start: block.start.toISOString(),
    end: block.end.toISOString(),
  });
}

// DELETE: clear current user's availability that overlaps a given window
export async function DELETE(req: Request) {
  const prisma = getPrisma();
  const current = await getCurrentUser();

  if (!current) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  if (!body?.start || !body?.end) {
    return NextResponse.json(
      { error: "Missing start or end time" },
      { status: 400 },
    );
  }

  const start = new Date(body.start);
  const end = new Date(body.end);

  await prisma.availabilityBlock.deleteMany({
    where: {
      userId: current.id,
      start: { lt: end },
      end: { gt: start },
    },
  });

  return NextResponse.json({ ok: true });
}
