import { ChartBrief } from "@/chartFormat/chart";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getFileEntry(cid: string) {
  const entry = await prisma.chartFile.findUnique({
    where: {
      cid: cid,
    },
    include: {
      levels: true,
    },
  });
  if (entry) {
    entry.levels = entry.levels.sort((a, b) => a.lvIndex - b.lvIndex);
  }
  return entry;
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
      chartCreator: brief.chartCreator,
    },
  });
  await createLevelsEntry(cid, brief);
}
async function createLevelsEntry(cid: string, brief: ChartBrief) {
  await Promise.all(
    brief.levels.map((level, i) =>
      prisma.levelBrief.upsert({
        where: {
          cid_lvIndex: {
            cid,
            lvIndex: i,
          },
        },
        update: {
          ...level,
        },
        create: {
          ...level,
          cid,
          lvIndex: i,
        },
      })
    )
  );
  await prisma.levelBrief.deleteMany({
    where: {
      cid: cid,
      lvIndex: {
        gte: brief.levels.length,
      },
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
      chartCreator: brief.chartCreator,
    },
  });
  await createLevelsEntry(cid, brief);
}
