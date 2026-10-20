import { NextResponse } from "next/server";

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "8",
      countrycodes: "et",
    });

    const res = await fetch(`${NOMINATIM_SEARCH}?${params}`, {
      headers: {
        "User-Agent": "Zinab/1.0 (https://zinab.example)",
        "Accept-Language": "en",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();

    const results = data.map((item: any) => {
      const addr = item.address || {};
      // Build a clear name like "Liben, Gojam, Amhara"
      const shortName =
        addr.village || addr.town || addr.city || addr.county || "Unknown";
      const region = addr.state || addr.region || "";
      const zone = addr.state_district || "";

      // If the display name is too long, we truncate it for the UI
      const displayName = item.display_name;

      return {
        displayName,
        shortName,
        region,
        zone,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[search] Nominatim failed:", err);
    return NextResponse.json({ results: [] });
  }
}
