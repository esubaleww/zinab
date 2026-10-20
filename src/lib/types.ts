export interface DailyWeather {
  date: string;
  rainMm: number;
  tMax: number | null;
  tMin: number | null;
  et0: number | null;
  soilMoisture: number | null;
  rainProb: number | null;
  isForecast: boolean;
  fetchedAt: string;
}

export interface SoilProfile {
  ph: number | null;
  clayPct: number | null;
  sandPct: number | null;
  organicCarbon: number | null;
}

export interface Conditions {
  lat: number;
  lon: number;
  past: DailyWeather[];
  forecast: DailyWeather[];
  soil: SoilProfile;
  fetchedAt: string;
}
