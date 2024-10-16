import "dotenv/config";

export async function fsAssign() {
  const fsRes = await fetch(process.env.FS_MASTER + "/dir/assign", {
    cache: "no-store",
  });
  const fsResBody = await fsRes.json();
  if (typeof fsResBody.fid === "string") {
    return { fid: fsResBody.fid };
  } else {
    console.log(fsRes);
    return null;
  }
}
export async function fsWrite(fid: string, data: Blob) {
  const formData = new FormData();
  const compressedBlob = await new Response(
    data.stream().pipeThrough(new CompressionStream("gzip"))
  ).blob();
  formData.append("file", compressedBlob);
  const fsPostRes = await fetch(process.env.FS_VOLUME + "/" + fid, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  if (fsPostRes.ok) {
    return true;
  } else {
    console.log(fsPostRes);
    return false;
  }
}
export async function fsRead(fid: string) {
  const fsRes = await fetch(process.env.FS_VOLUME + "/" + fid, {
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
export async function fsDelete(fid: string) {
  const fsRes = await fetch(process.env.FS_VOLUME + "/" + fid, {
    method: "DELETE",
    cache: "no-store",
  });
  if (fsRes.ok) {
    return true;
  } else {
    console.log(fsRes);
    return false;
  }
}
