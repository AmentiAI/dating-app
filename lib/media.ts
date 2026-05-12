import type { MediaItem } from "./types";

function isBlobHost(url: string): boolean {
  return /https?:\/\/[^/]*blob\.vercel-storage\.com\//i.test(url);
}

export function toProxyPhotoUrl(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return raw;
  if (raw.startsWith("/api/uploads?url=")) return raw;
  if (raw.startsWith("/api/uploads/view?url=")) {
    return raw.replace("/api/uploads/view?url=", "/api/uploads?url=");
  }
  if (isBlobHost(raw)) {
    return `/api/uploads?url=${encodeURIComponent(raw)}`;
  }
  return raw;
}

export function normalizeMedia(items: MediaItem[]): MediaItem[] {
  return items.map((m) => (m.kind === "photo" ? { ...m, url: toProxyPhotoUrl(m.url) } : m));
}
