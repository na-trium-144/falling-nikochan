import { existsSync, readFile } from "node:fs";
import { dirname, join } from "node:path";
import mime from "mime-types";

export async function fetchStatic(path: string): Promise<Response> {
  if (!path.includes("..")) {
    for (const filePath of [
      join(dirname(import.meta.dirname), "out", path),
      join(dirname(import.meta.dirname), "out", path, "index.html"),
      join(dirname(import.meta.dirname), "out", path + ".html"),
    ]) {
      if (existsSync(filePath)) {
        return new Promise((resolve) =>
          readFile(filePath, (err, data) => {
            if (err) {
              console.error(err);
              resolve(new Response(null, { status: 500 }));
            } else {
              resolve(
                new Response(data, {
                  status: 200,
                  headers: {
                    "Content-Type": mime.lookup(filePath) || "text/plain",
                  },
                })
              );
            }
          })
        );
      }
    }
  }
  return new Response(null, { status: 404 });
}
