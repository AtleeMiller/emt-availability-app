import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const users = [
    {
      name: "Atlee Miller",
      email: "atlee@example.com",
      password: "test1234",
      role: "ADMIN",
    },
    {
      name: "Driver One",
      email: "driver1@example.com",
      password: "test1234",
      role: "USER",
    },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role as any,
      },
    });
    console.log(`Seeded ${u.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
