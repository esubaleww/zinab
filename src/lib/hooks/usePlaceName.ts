import { useEffect, useState } from "react";
import { reverseGeocode, type PlaceName } from "../geocode";

export function usePlaceName(
  lat: number,
  lon: number,
  skip: boolean = false,
): PlaceName | null {
  const [name, setName] = useState<PlaceName | null>(null);

  useEffect(() => {
    if (skip) {
      setName(null);
      return;
    }

    let cancelled = false;
    setName(null);
    reverseGeocode(lat, lon).then((place) => {
      if (!cancelled) setName(place);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lon, skip]);

  return name;
}
