/** Video link helpers shared by the site player and the admin Media Library. */

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function youTubeId(url: string): string | null {
  const u = parse(url);
  if (!u) return null;
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
  if (host === "youtube.com" || host === "m.youtube.com") {
    return u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1] ?? null;
  }
  return null;
}

export function vimeoId(url: string): string | null {
  const u = parse(url);
  if (!u) return null;
  const host = u.hostname.replace(/^www\./, "");
  if (host === "vimeo.com") return u.pathname.match(/^\/(\d+)/)?.[1] ?? null;
  if (host === "player.vimeo.com") return u.pathname.match(/^\/video\/(\d+)/)?.[1] ?? null;
  return null;
}

export function videoProvider(url: string): "youtube" | "vimeo" | "link" {
  if (youTubeId(url)) return "youtube";
  if (vimeoId(url)) return "vimeo";
  return "link";
}

/** A thumbnail we can derive without an API call (YouTube only). */
export function autoThumbnail(url: string): string | null {
  const id = youTubeId(url);
  return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : null;
}

export type Player = { kind: "iframe" | "video"; src: string };

/** YouTube/Vimeo links become embeds, direct files play natively; anything else returns null. */
export function toPlayer(url: string): Player | null {
  const yt = youTubeId(url);
  if (yt) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?autoplay=1` };
  const vm = vimeoId(url);
  if (vm) return { kind: "iframe", src: `https://player.vimeo.com/video/${vm}?autoplay=1` };
  const u = parse(url);
  if (u && u.protocol === "https:" && /\.(mp4|webm|ogg|mov)$/i.test(u.pathname)) return { kind: "video", src: url };
  return null;
}
