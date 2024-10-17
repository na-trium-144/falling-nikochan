import "dotenv/config";

export async function fsAssign() {
  const fsRes = await fetch(process.env.FS_MASTER + "/dir/assign", {
    cache: "no-store",
  });
  const fsResBody = await fsRes.json();
  if (
    typeof fsResBody.fid === "string" &&
    typeof fsResBody.publicUrl === "string"
  ) {
    return { fid: fsResBody.fid, volumeUrl: fsResBody.publicUrl };
  } else {
    console.log(fsRes);
    return null;
  }
}
async function fsLookup(fid: string) {
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
export async function fsWrite(
  fid: string,
  volumeUrl: string | null,
  data: Blob
) {
  if (volumeUrl === null) {
    volumeUrl = await fsLookup(fid);
  }
  if (volumeUrl === null) {
    return false;
  }
  const formData = new FormData();
  const compressedBlob = await new Response(
    data.stream().pipeThrough(new CompressionStream("gzip"))
  ).blob();
  formData.append("file", compressedBlob);
  const fsPostRes = await fetch(volumeUrl + "/" + fid, {
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
export async function fsRead(fid: string, volumeUrl: string | null) {
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
export async function fsDelete(fid: string, volumeUrl: string | null) {
  if (volumeUrl === null) {
    volumeUrl = await fsLookup(fid);
  }
  if (volumeUrl === null) {
    return false;
  }
  const fsRes = await fetch(volumeUrl + "/" + fid, {
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
