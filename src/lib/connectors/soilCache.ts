import { fetchSoil } from "./soilGrids";
import type { SoilProfile } from "../types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; 
const GRID = 0.05; 

interface CacheEntry {
  soil: SoilProfile;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

function gridKey(lat: number, lon: number): string {
  const r = (n: number) => (Math.round(n / GRID) * GRID).toFixed(2);
  return `${r(lat)}_${r(lon)}`;
}

export async function getCachedSoil(
  lat: number,
  lon: number,
): Promise<SoilProfile> {
  const key = gridKey(lat, lon);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) {
    console.log("[soil-cache] HIT", key);
    return hit.soil;
  }

  console.log("[soil-cache] MISS", key, "— fetching");
  const soil = await fetchSoil(lat, lon);
  cache.set(key, { soil, fetchedAt: Date.now() });
  return soil;
}
