export interface LocationPreset {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
}

export const PRESETS: LocationPreset[] = [
  { id: "bishoftu", name: "Bishoftu", region: "Oromia", lat: 8.75, lon: 38.98 },
  {
    id: "addis",
    name: "Addis Ababa",
    region: "Addis Ababa",
    lat: 9.03,
    lon: 38.74,
  },
  {
    id: "bahirdar",
    name: "Bahir Dar",
    region: "Amhara",
    lat: 11.59,
    lon: 37.39,
  },
  { id: "mekelle", name: "Mekelle", region: "Tigray", lat: 13.5, lon: 39.47 },
  { id: "hawassa", name: "Hawassa", region: "Sidama", lat: 7.06, lon: 38.48 },
  { id: "jimma", name: "Jimma", region: "Oromia", lat: 7.67, lon: 36.83 },
];

export const DEFAULT_PRESET = PRESETS[2];
