import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[];

const genAIClients = geminiKeys.map((key) => new GoogleGenAI({ apiKey: key }));

// Simple in-memory cache: key = text + languageCode
const ttsCache = new Map<string, string>();

export async function POST(req: Request) {
  try {
    const { text, languageCode = "am-ET" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const cacheKey = `${languageCode}::${text}`;

    // Check cache first
    if (ttsCache.has(cacheKey)) {
      console.log(`[tts] Cache HIT for: "${text.substring(0, 30)}..."`);
      return NextResponse.json({ audioBase64: ttsCache.get(cacheKey) });
    }

    // Cache miss — call Gemini
    for (let i = 0; i < genAIClients.length; i++) {
      try {
        const client = genAIClients[i];
        const response = await client.models.generateContent({
          model: "gemini-3.8-flash-lite-tts",
          contents: [{ text }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: { languageCode },
          },
        });

        const audioPart = response.candidates?.[0]?.content?.parts?.find(
          (p: any) => p.inlineData,
        );

        if (audioPart?.inlineData?.data) {
          const audioBase64 = audioPart.inlineData.data;
          ttsCache.set(cacheKey, audioBase64); // Save to cache
          console.log(`[tts] Succeeded with key #${i + 1} (cached)`);
          return NextResponse.json({ audioBase64 });
        }
      } catch (err: any) {
        console.warn(`[tts] Failed with key #${i + 1}:`, err.message);
      }
    }

    return NextResponse.json(
      { error: "TTS quota exceeded for all keys" },
      { status: 429 },
    );
  } catch (error: any) {
    console.error("[tts] FATAL ERROR:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
