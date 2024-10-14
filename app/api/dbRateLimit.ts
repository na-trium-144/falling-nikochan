import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const rateLimitMin = 10;

export async function updateLastCreate(ip: string) {
  const rateLimit = await prisma.createRateLimit.findUnique({
    where: {
      ip: ip,
    },
  });
  if (
    rateLimit &&
    new Date().getTime() - rateLimit.lastCreate.getTime() <
      rateLimitMin * 60 * 1000
  ) {
    return false;
  } else {
    await prisma.createRateLimit.upsert({
      where: {
        ip: ip,
      },
      update: {},
      create: { ip: ip },
    });
    return true;
  }
}
