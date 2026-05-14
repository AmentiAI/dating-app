/**
 * Who appears in Discover for a given viewer vs candidate gender / interested_in.
 * Empty interested_in (legacy) is treated as no restriction.
 */

export function viewerInterestedShowsCandidate(
  viewerInterestedIn: string[],
  candidateGender: string | null
): boolean {
  if (viewerInterestedIn.length === 0 || viewerInterestedIn.includes("Everyone")) return true;
  const wantsMen = viewerInterestedIn.includes("Men");
  const wantsWomen = viewerInterestedIn.includes("Women");
  if (!wantsMen && !wantsWomen) return true;
  const g = (candidateGender ?? "").trim();
  if (g === "Male") return wantsMen;
  if (g === "Female") return wantsWomen;
  return wantsMen || wantsWomen;
}

export function candidateInterestedShowsViewer(
  candidateInterestedIn: string[],
  viewerGender: string | null
): boolean {
  return viewerInterestedShowsCandidate(candidateInterestedIn, viewerGender);
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Great-circle distance in km. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normCity(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function pairHash(a: string, b: string): number {
  const s = a < b ? `${a}|${b}` : `${b}|${a}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic pseudo-distance when we have no coordinates (1 .. maxKm). */
export function seededDistanceKm(viewerId: string, candidateId: string, maxKm: number): number {
  const cap = Math.max(1, Math.floor(maxKm));
  return 1 + (pairHash(viewerId, candidateId) % cap);
}

export type LatLng = { lat: number; lng: number };

export function parseLatLng(
  lat: unknown,
  lng: unknown
): LatLng | null {
  const la = typeof lat === "number" ? lat : lat != null ? Number(lat) : NaN;
  const lo = typeof lng === "number" ? lng : lng != null ? Number(lng) : NaN;
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
  return { lat: la, lng: lo };
}

/**
 * Prefer GPS haversine; same metro (city string) → short synthetic distance;
 * otherwise deterministic km so compatibility scoring stays stable.
 */
export function estimateDistanceKm(input: {
  viewerId: string;
  candidateId: string;
  viewerLatLng: LatLng | null;
  candidateLatLng: LatLng | null;
  viewerCity: string | null;
  candidateCity: string | null;
  maxKm: number;
}): number {
  const { viewerLatLng, candidateLatLng, viewerCity, candidateCity, viewerId, candidateId, maxKm } = input;
  if (viewerLatLng && candidateLatLng) {
    return haversineKm(viewerLatLng.lat, viewerLatLng.lng, candidateLatLng.lat, candidateLatLng.lng);
  }
  const vc = normCity(viewerCity);
  const cc = normCity(candidateCity);
  if (vc.length > 1 && cc.length > 1 && vc === cc) {
    return Math.min(6, Math.max(1, Math.floor(maxKm * 0.08)));
  }
  return seededDistanceKm(viewerId, candidateId, maxKm);
}
