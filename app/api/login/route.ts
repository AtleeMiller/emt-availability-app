import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

  // Set basic session cookie
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
