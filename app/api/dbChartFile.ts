import { ChartBrief } from "@/chartFormat/chart";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getFileEntry(cid: string) {
  return await prisma.chartFile.findUnique({
    where: {
      cid: cid,
    },
    include: {
      levels: true,
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
      chartCreator: brief.chartCreator,
    },
  });
  await createLevelsEntry(cid, brief);
}
async function createLevelsEntry(cid: string, brief: ChartBrief) {
  await prisma.levelBrief.createMany({
    data: brief.levels.map((level) => ({
      cid: cid,
      name: level.name,
      hash: level.hash,
      type: level.type,
      noteCount: level.noteCount,
      difficulty: level.difficulty,
      bpmMin: level.bpmMin,
      bpmMax: level.bpmMax,
    })),
  });
}
export async function updateFileEntry(cid: string, brief: ChartBrief) {
  await prisma.levelBrief.deleteMany({
    where: {
      cid: cid,
    },
  });
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
