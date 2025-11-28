// lib/auth.ts
import { cookies } from "next/headers";
import { getPrisma } from "./prisma";

const SESSION_COOKIE = "emt_session";

type SessionPayload = {
  userId: number;
};

function parseSession(raw: string | undefined): SessionPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionPayload;
    if (!parsed.userId || typeof parsed.userId !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = parseSession(raw);
  if (!payload) return null;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  return user ?? null;
}
