import { ChartBrief } from "@/chartFormat/chart";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getFileEntry(cid: string, includeLevels: boolean) {
  const entry = await prisma.chartFile.findUnique({
    where: {
      cid: cid,
    },
    include: {
      levels: includeLevels,
      playCount: true,
    },
  });
  if (entry?.levels !== undefined) {
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
      updatedAt: new Date(brief.updatedAt),
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
      updatedAt: new Date(brief.updatedAt),
    },
  });
  await createLevelsEntry(cid, brief);
}
export async function updatePlayCount(cid: string) {
  await prisma.playCount.upsert({
    where: {
      cid,
    },
    update: {
      count: {
        increment: 1,
      },
    },
    create: {
      cid,
      count: 1,
    },
  });
}
