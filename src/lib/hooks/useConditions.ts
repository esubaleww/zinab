import { useEffect, useState } from "react";
import { getConditions } from "../services/conditions";
import type { Conditions } from "../types";

export function useConditions(lat: number, lon: number) {
  const [data, setData] = useState<Conditions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getConditions(lat, lon)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return { data, loading, error };
}
