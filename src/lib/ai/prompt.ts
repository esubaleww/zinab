import type { ComputedFacts } from "../facts";

export const SYSTEM_PROMPT = `You are Zinab, a helpful farming advisor for Ethiopia.
You will receive a farmer's question (if they asked one) and a JSON object of weather facts.

Your job:
1. If a question is provided, you MUST answer THAT SPECIFIC QUESTION using the facts.
   - Do not just summarize the weather.
   - Be direct and helpful.
2. If NO question is provided, give a 2-3 sentence summary of the most important facts.
3. If the farmer asks about planting, reason based on the dry spell and soil moisture (as per the facts).
4. NEVER invent numbers. Only use the numbers from the facts.
5. Keep it to 3-4 detailed sentences.
6. End with: "Discuss with your local Development Agent."

Output only the English text.`;

export function buildUserPrompt(
  facts: ComputedFacts,
  crop: string,
  placeLabel: string,
  questionText?: string,
): string {
  const cleanFacts = {
    location: placeLabel,
    crop,
    rain_last_7_days_mm: facts.rain7DaysMm,
    rain_today_mm: facts.rainTodayMm,
    rain_today_probability_pct: facts.rainTodayProb,
    rain_next_16_days_mm: facts.rainNext16Mm,
    longest_dry_spell_next_16_days: facts.longestDryRunDays,
    today_temperature_c: facts.todayTemp,
    today_soil_moisture_pct: facts.todaySoilMoisturePct,
    soil_ph: facts.soilPh,
    soil_texture: facts.soilTexture,
  };

  let prompt = `Facts:\n${JSON.stringify(cleanFacts, null, 2)}\n\n`;

  if (questionText) {
    prompt += `The farmer specifically asks: "${questionText}"\n`;
    prompt += `You MUST answer this exact question using the facts above. Do not just give a general summary.\n`;
  } else {
    prompt += `The farmer did not ask a specific question. Provide a general summary of the weather for their crops.\n`;
  }

  prompt += `Write the answer in English now.`;
  return prompt;
}
