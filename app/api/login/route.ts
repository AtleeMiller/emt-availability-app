import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "emt_session";

export async function POST(req: Request) {
  const prisma = getPrisma();

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: "Missing email or password" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  }

  const res = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  // Simple JSON cookie storing the userId so getCurrentUser() can find them
  res.cookies.set(
    SESSION_COOKIE,
    JSON.stringify({ userId: user.id }),
    {
      httpOnly: true,
      path: "/",
    }
  );

  return res;
}
