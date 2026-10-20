import type { Conditions, DailyWeather } from "./types";
import type { IconName } from "@/components/Icon";

const FIELD_CAPACITY = 0.3;

export interface ComputedFacts {
  rainTodayMm: number;
  rainTodayProb: number | null;
  rain7DaysMm: number;
  todayTemp: number | null;
  todaySoilMoisturePct: number | null;
  rainNext16Mm: number;
  longestDryRunDays: number;
  verdict: { label: string; badge: string; badgeColor: string };
  soilTexture: string;
  phLabel: string;
  phLabelColor: string;
  soilPh: number | null;
}

export function computeFacts(cond: Conditions): ComputedFacts {
  const last7 = cond.past.slice(-7);
  const rain7DaysMm = round1(last7.reduce((s, d) => s + d.rainMm, 0));

  const todayItem: DailyWeather | undefined = cond.forecast[0];
  const rainTodayMm = todayItem?.rainMm ?? 0;
  const rainTodayProb = todayItem?.rainProb ?? null;
  const todayTemp = todayItem?.tMax != null ? Math.round(todayItem.tMax) : null;

  const rawMoisture = todayItem?.soilMoisture ?? null;
  const todaySoilMoisturePct =
    rawMoisture != null
      ? Math.min(100, Math.round((rawMoisture / FIELD_CAPACITY) * 100))
      : null;

  const rainNext16Mm = round1(cond.forecast.reduce((s, d) => s + d.rainMm, 0));
  const longestDryRunDays = longestDryRun(cond.forecast);

  let verdict: { label: string; badge: string; badgeColor: string };
  if (longestDryRunDays >= 7) {
    verdict = {
      label: "Dry spell ahead",
      badge: "Watch",
      badgeColor: "bg-[#f0e0b0] text-[#6b5418]",
    };
  } else if (rainNext16Mm > 80) {
    verdict = {
      label: "Heavy rain expected",
      badge: "Watch",
      badgeColor: "bg-[#f0e0b0] text-[#6b5418]",
    };
  } else if (rainNext16Mm > 15) {
    verdict = {
      label: "Good conditions",
      badge: "Low risk",
      badgeColor: "bg-[#dfe8ad] text-[#3d5928]",
    };
  } else {
    verdict = {
      label: "Stable conditions",
      badge: "Low risk",
      badgeColor: "bg-[#dfe8ad] text-[#3d5928]",
    };
  }

  const soilTexture = classifyTexture(cond.soil.clayPct, cond.soil.sandPct);

  const ph = cond.soil.ph;
  const phLabel =
    ph == null ? "—" : ph < 5.5 ? "Acidic" : ph > 7.5 ? "Alkaline" : "Optimal";
  const phLabelColor =
    phLabel === "Optimal" ? "text-[#e1f06a]" : "text-[#f0c46a]";

  return {
    rain7DaysMm,
    rainTodayMm,
    rainTodayProb,
    todayTemp,
    todaySoilMoisturePct,
    rainNext16Mm,
    longestDryRunDays,
    verdict,
    soilTexture,
    phLabel,
    phLabelColor,
    soilPh: cond.soil.ph,
  };
}

export function pickDayIcon(day: DailyWeather): IconName {
  if (day.rainMm >= 5) return "rain";
  if (day.rainMm >= 1 || (day.rainProb ?? 0) >= 50) return "cloud";
  return "sun";
}

export function formatDayShort(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function longestDryRun(days: DailyWeather[]): number {
  let longest = 0;
  let current = 0;
  for (const d of days) {
    if (d.rainMm < 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

function classifyTexture(clay: number | null, sand: number | null): string {
  if (clay == null || sand == null) return "—";
  if (clay >= 40) return "Clay";
  if (clay >= 27) return sand >= 45 ? "Sandy clay" : "Clay loam";
  if (clay >= 20) return "Loam";
  if (sand >= 70) return "Sandy";
  return "Sandy loam";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
