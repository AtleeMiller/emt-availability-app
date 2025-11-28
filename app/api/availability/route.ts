import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
      { status: 400 }
    );
  }

  const item = await prisma.availability.create({
    data: {
      userId: current.id,
      start: new Date(body.start),
      end: new Date(body.end),
    },
  });

  return NextResponse.json(item);
}

export async function GET() {
  const prisma = getPrisma();

  const items = await prisma.availability.findMany({
    include: { user: true },
  });

  return NextResponse.json(items);
}
