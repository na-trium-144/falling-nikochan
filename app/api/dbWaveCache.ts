import { ChartBrief } from "@/chartFormat/chart";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getWaveEntry(ytId: string) {
  return await prisma.waveCache.findUnique({
    where: {
      ytId: ytId,
    },
  });
}
export async function createWaveEntry(
  ytId: string,
  fid: string
) {
  await prisma.waveCache.create({
    data: {
      ytId: ytId,
      fid: fid,
    },
  });
}
