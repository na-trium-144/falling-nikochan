import { ChartBrief } from "@/chartFormat/chart";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getFileEntry(cid: string) {
  return await prisma.chartFile.findUnique({
    where: {
      cid: cid,
    },
  });
}
export async function createFileEntry(
  cid: string,
  fid: string,
  brief: ChartBrief
) {
  await prisma.chartFile.create({
    data: {
      cid: cid,
      fid: fid,
      ytId: brief.ytId,
      title: brief.title,
      composer: brief.composer,
    },
  });
}
export async function updateFileEntry(cid: string, brief: ChartBrief) {
  await prisma.chartFile.update({
    where: {
      cid: cid,
    },
    data: {
      ytId: brief.ytId,
      title: brief.title,
      composer: brief.composer,
    },
  });
}
