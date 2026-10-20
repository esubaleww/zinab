import { useEffect, useState, useRef } from "react";
import type { ComputedFacts } from "../facts";

const explanationCache = new Map<string, string>();

export function useAIExplanation(
  facts: ComputedFacts | null,
  crop: string,
  placeLabel: string,
) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequestRef = useRef<string>("");

  useEffect(() => {
    if (!facts) return;

    const cacheKey = JSON.stringify({
      placeLabel,
      crop,
      rain7: facts.rain7DaysMm,
      rain16: facts.rainNext16Mm,
      dry: facts.longestDryRunDays,
      soil: facts.todaySoilMoisturePct,
      temp: facts.todayTemp,
    });

    if (explanationCache.has(cacheKey)) {
      setText(explanationCache.get(cacheKey)!);
      setLoading(false);
      setError(null);
      return;
    }

    if (lastRequestRef.current === cacheKey) return;
    lastRequestRef.current = cacheKey;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facts, crop, placeLabel }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("AI failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data.text) {
          explanationCache.set(cacheKey, data.text);
          setText(data.text);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [facts, crop, placeLabel]);

  return { text, loading, error };
}
