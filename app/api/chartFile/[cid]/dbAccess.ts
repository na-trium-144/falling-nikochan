import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getFileEntry(cid: string) {
  return await prisma.chartFile.findUnique({
    where: {
      cid: cid,
    },
  });
}
export async function createFileEntry(cid: string, fid: string) {
  await prisma.chartFile.create({
    data: {
      cid: cid,
      fid: fid,
    },
  });
}
