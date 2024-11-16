import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import "dotenv/config";
import msgpack from "@ygoe/msgpack";
const prisma = new PrismaClient();

async function fsLookup(fid) {
  const fsRes = await fetch(
    process.env.FS_MASTER +
      "/dir/lookup?volumeId=" +
      fid.slice(0, fid.indexOf(",")),
    {
      cache: "no-store",
    }
  );
  const fsResBody = await fsRes.json();
  if (typeof fsResBody.locations?.at(0)?.publicUrl === "string") {
    console.log(fsResBody.locations.at(0).publicUrl)
    return fsResBody.locations.at(0).publicUrl;
  } else {
    console.log(fsRes);
    return null;
  }
}
export async function fsRead(fid, volumeUrl) {
  if (volumeUrl === null) {
    volumeUrl = await fsLookup(fid);
  }
  if (volumeUrl === null) {
    return null;
  }
  const fsRes = await fetch(volumeUrl + "/" + fid, {
    cache: "no-store",
  });
  if (fsRes.ok && fsRes.body) {
    const decompressedBuf = await new Response(
      fsRes.body.pipeThrough(new DecompressionStream("gzip"))
    ).arrayBuffer();
    return { data: decompressedBuf };
  } else {
    console.log(fsRes);
    return null;
  }
}

const entries = await prisma.chartFile.findMany({
  include: {
    levels: true,
    playCount: true,
  },
});
const exportEntries = [];
for(const fileEntry of entries){
  console.log(fileEntry.cid);
  const fsData = await fsRead(fileEntry.fid, null);
  let chart;
  chart = msgpack.deserialize(fsData.data);

  exportEntries.push({
    ...fileEntry,
    chart: chart,
  })
}

writeFileSync("./exportEntries.json", JSON.stringify(exportEntries));
