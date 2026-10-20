import type { SoilProfile } from "../types";

const BASE = "https://rest.isric.org/soilgrids/v2.0/properties/query";
const PROPS = ["phh2o", "clay", "sand", "soc"] as const;

export async function fetchSoil(
  lat: number,
  lon: number,
): Promise<SoilProfile> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    depth: "0-5cm",
    value: "mean",
  });
  PROPS.forEach((p) => params.append("property", p));

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`SoilGrids ${res.status}`);
  const json = await res.json();

  const get = (name: string) =>
    json?.properties?.layers?.find((l: { name: string }) => l.name === name)
      ?.depths?.[0]?.values?.mean ?? null;

  const ph = get("phh2o");
  const clay = get("clay");
  const sand = get("sand");

  return {
    ph: ph != null ? ph / 10 : null,
    clayPct: clay != null ? clay / 10 : null,
    sandPct: sand != null ? sand / 10 : null,
    organicCarbon: get("soc"),
  };
}
