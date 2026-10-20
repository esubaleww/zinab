import type { ComputedFacts } from "../facts";
import { buildUserPrompt } from "./prompt";

function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(\.\d+)?/g) || [];
  return matches.map(Number);
}

export function validateNumbers(
  aiText: string,
  facts: ComputedFacts,
  crop: string,
  placeLabel: string,
): boolean {
  const allowedNumbers = new Set<number>();

  const addFact = (val: number | null | undefined) => {
    if (val != null) {
      allowedNumbers.add(val);
      allowedNumbers.add(Math.round(val));
      allowedNumbers.add(Number(val.toFixed(1)));
    }
  };

  addFact(facts.rain7DaysMm);
  addFact(facts.rainTodayMm);
  addFact(facts.rainTodayProb);
  addFact(facts.rainNext16Mm);
  addFact(facts.longestDryRunDays);
  addFact(facts.todayTemp);
  addFact(facts.todaySoilMoisturePct);
  addFact(facts.soilPh);

  const promptText = buildUserPrompt(facts, crop, placeLabel, "");
  const promptNumbers = extractNumbers(promptText);
  promptNumbers.forEach((n) => allowedNumbers.add(n));

  const foundNumbers = extractNumbers(aiText);

  for (const num of foundNumbers) {
    if (num < 1 || num > 2000) continue;
    if (!allowedNumbers.has(num)) {
      console.warn(`[validator] Hallucinated number found: ${num}`, {
        allowedNumbers,
        aiText,
      });
      return false;
    }
  }

  return true;
}
