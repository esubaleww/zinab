import type { DailyWeather } from "../types";

const BASE = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

interface ForecastJson {
  daily: {
    time: string[];
    precipitation_sum: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    et0_fao_evapotranspiration?: (number | null)[];
  };
  hourly?: {
    time: string[];
    soil_moisture_3_to_9cm?: (number | null)[];
  };
}

interface ArchiveJson {
  daily: {
    time: string[];
    precipitation_sum: (number | null)[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
  };
}

function dailySoilMoistureFromHourly(hourly?: {
  time: string[];
  soil_moisture_3_to_9cm?: (number | null)[];
}): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  if (!hourly?.time) return out;
  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i];
    if (!t.endsWith("T15:00")) continue;
    const date = t.slice(0, 10);
    out[date] = hourly.soil_moisture_3_to_9cm?.[i] ?? null;
  }
  return out;
}

export async function fetchForecast(
  lat: number,
  lon: number,
): Promise<DailyWeather[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: [
      "precipitation_sum",
      "precipitation_probability_max",
      "temperature_2m_max",
      "temperature_2m_min",
      "et0_fao_evapotranspiration",
    ].join(","),
    hourly: "soil_moisture_3_to_9cm",
    timezone: "Africa/Addis_Ababa",
    past_days: "30",
    forecast_days: "16",
  });

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Open-Meteo forecast ${res.status}: ${body}`);
  }
  const json: ForecastJson = await res.json();
  const now = new Date().toISOString();
  const soilByDate = dailySoilMoistureFromHourly(json.hourly);
  const today = new Date().toISOString().slice(0, 10);

  return json.daily.time.map((date, i) => ({
    date,
    rainMm: json.daily.precipitation_sum?.[i] ?? 0,
    tMax: json.daily.temperature_2m_max?.[i] ?? null,
    tMin: json.daily.temperature_2m_min?.[i] ?? null,
    et0: json.daily.et0_fao_evapotranspiration?.[i] ?? null,
    soilMoisture: soilByDate[date] ?? null,
    rainProb: json.daily.precipitation_probability_max?.[i] ?? null,
    isForecast: date >= today,
    fetchedAt: now,
  }));
}

export async function fetchHistorical(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<DailyWeather[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: startDate,
    end_date: endDate,
    daily: [
      "precipitation_sum",
      "temperature_2m_max",
      "temperature_2m_min",
    ].join(","),
    timezone: "Africa/Addis_Ababa",
  });
  const res = await fetch(`${ARCHIVE}?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Open-Meteo archive ${res.status}: ${body}`);
  }
  const json: ArchiveJson = await res.json();
  const now = new Date().toISOString();

  return json.daily.time.map((date, i) => ({
    date,
    rainMm: json.daily.precipitation_sum?.[i] ?? 0,
    tMax: json.daily.temperature_2m_max?.[i] ?? null,
    tMin: json.daily.temperature_2m_min?.[i] ?? null,
    et0: null,
    soilMoisture: null,
    rainProb: null,
    isForecast: false,
    fetchedAt: now,
  }));
}
