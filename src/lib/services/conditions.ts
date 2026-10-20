import { fetchForecast } from "../connectors/openMeteo";
import { getCachedSoil } from "../connectors/soilCache";
import type { Conditions, SoilProfile } from "../types";

const EMPTY_SOIL: SoilProfile = {
  ph: null,
  clayPct: null,
  sandPct: null,
  organicCarbon: null,
};

export async function getConditions(
  lat: number,
  lon: number,
): Promise<Conditions> {
  const t0 = performance.now();
  console.log("[conditions] fetching...");

  const all = await fetchForecast(lat, lon);
  console.log(
    "[conditions] forecast done in",
    Math.round(performance.now() - t0),
    "ms",
  );

  const today = new Date().toISOString().slice(0, 10);
  const past = all.filter((d) => d.date < today);
  const forecast = all.filter((d) => d.date >= today);

  let soil: SoilProfile = EMPTY_SOIL;
  try {
    soil = await Promise.race([
      getCachedSoil(lat, lon),
      new Promise<SoilProfile>((_, reject) =>
        setTimeout(() => reject(new Error("soil timeout")), 25000),
      ),
    ]);
    console.log("[conditions] soil done");
  } catch (e) {
    console.warn("[conditions] soil skipped:", e);
  }

  console.log("[conditions] final:", {
    pastCount: past.length,
    forecastCount: forecast.length,
    soilOk: soil !== EMPTY_SOIL,
    totalMs: Math.round(performance.now() - t0),
  });

  return {
    lat,
    lon,
    past,
    forecast,
    soil,
    fetchedAt: new Date().toISOString(),
  };
}
