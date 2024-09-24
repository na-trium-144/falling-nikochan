export function checkYouTubeId(url: string) {
  const id = getYouTubeId(url);
  return id.length === 11 && /^[-_\w]{11}$/.test(id);
}
export function getYouTubeId(url: string) {
  if (url.startsWith("https://www.youtube.com/watch?v=")) {
    const v = url.slice(32);
    if (v.includes("&")) {
      return v.slice(0, v.indexOf("&"));
    } else {
      return v;
    }
  } else if (url.startsWith("https://youtu.be/")) {
    const v = url.slice(17);
    if (v.includes("?")) {
      return v.slice(0, v.indexOf("?"));
    } else {
      return v;
    }
  } else {
    return url;
  }
}
