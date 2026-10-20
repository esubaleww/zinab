const NOMINATIM = "https://nominatim.openstreetmap.org/reverse";

export interface PlaceName {
  short: string;
  full: string;
}

const cache = new Map<string, PlaceName>();

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<PlaceName | null> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: "json",
      zoom: "14",
      addressdetails: "1",
    });
    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "Zinab/1.0 (https://zinab.example)",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const addr = json.address ?? {};

    const exactPlace =
      addr.village ||
      addr.hamlet ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.town ||
      addr.city;

    if (exactPlace) {
      const region = addr.state || addr.region || "";
      const country = addr.country || "Ethiopia";
      const full = [exactPlace, region, country].filter(Boolean).join(", ");
      const result: PlaceName = { short: exactPlace, full };
      cache.set(key, result);
      return result;
    }

    const nearPlace =
      addr.city_district ||
      addr.municipality ||
      addr.county ||
      addr.state_district;

    if (nearPlace) {
      const region = addr.state || addr.region || "";
      const country = addr.country || "Ethiopia";
      const short = `Near ${nearPlace}`;
      const full = [short, region, country].filter(Boolean).join(", ");
      const result: PlaceName = { short, full };
      cache.set(key, result);
      return result;
    }

    if (addr.state || addr.region) {
      const region = addr.state || addr.region;
      const country = addr.country || "Ethiopia";
      const short = `Near ${region}`;
      const full = [region, country].filter(Boolean).join(", ");
      const result: PlaceName = { short, full };
      cache.set(key, result);
      return result;
    }

    const fallback: PlaceName = {
      short: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      full: "Ethiopia",
    };
    cache.set(key, fallback);
    return fallback;
  } catch {
    return null;
  }
}
