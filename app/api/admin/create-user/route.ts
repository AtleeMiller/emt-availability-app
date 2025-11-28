import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (!body?.name || !body?.email || !body?.password) {
    return NextResponse.json(
      { error: "Missing name, email, or password" },
      { status: 400 }
    );
  }

  const role = body.role === "ADMIN" ? "ADMIN" : "USER";

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "User with that email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      role,
    },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
