import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";
import { validateNumbers } from "@/lib/ai/validator";
import type { ComputedFacts } from "@/lib/facts";

const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[];

const genAIClients = geminiKeys.map((key) => new GoogleGenAI({ apiKey: key }));
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function translateToAmharic(text: string): Promise<string> {
  for (let i = 0; i < genAIClients.length; i++) {
    try {
      const translation = await genAIClients[i].models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            text: `Translate the following English text to Amharic. Output ONLY the Amharic translation:\n\n${text}`,
          },
        ],
      });
      if (translation.text) return translation.text;
    } catch (err) {
      console.warn(`[text-ask] Translation failed with key #${i + 1}`);
    }
  }
  return text;
}

export async function POST(req: Request) {
  try {
    const { text: questionText, facts, crop, placeLabel } = await req.json();

    if (!questionText || !facts) {
      return NextResponse.json(
        { error: "Missing text or facts" },
        { status: 400 },
      );
    }

    console.log("=== [text-ask] QUESTION ===", questionText);

    // 1. Groq Brain
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt(
            facts as ComputedFacts,
            crop,
            placeLabel,
            questionText,
          ),
        },
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0.3,
      max_tokens: 500,
      // @ts-ignore
      reasoning_effort: "low",
    });

    const aiText = completion.choices[0]?.message?.content?.trim() || "";
    const isValid = validateNumbers(
      aiText,
      facts as ComputedFacts,
      crop,
      placeLabel,
    );

    const safeEnglish = isValid
      ? aiText
      : `Rain next 16 days: ${facts.rainNext16Mm} mm. Discuss with your local Development Agent.`;

    console.log("=== [text-ask] ENGLISH ANSWER ===", safeEnglish);

    // 2. Gemini Translation (only if Amharic)
    let finalAnswer = safeEnglish;
    const isAmharic = /[\u1200-\u137F]/.test(questionText);

    if (isAmharic) {
      console.log("[text-ask] Amharic detected. Translating...");
      finalAnswer = await translateToAmharic(safeEnglish);
    }

    return NextResponse.json({
      question: questionText,
      answer: finalAnswer,
    });
  } catch (error: any) {
    console.error("[text-ask] FATAL ERROR:", error?.message || error);
    return NextResponse.json({ error: "Text service failed" }, { status: 500 });
  }
}
