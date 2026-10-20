import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[];

const genAIClients = geminiKeys.map((key) => new GoogleGenAI({ apiKey: key }));

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Missing text or targetLang" },
        { status: 400 },
      );
    }

    for (let i = 0; i < genAIClients.length; i++) {
      try {
        const client = genAIClients[i];
        const translation = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              text: `Translate the following English text to ${targetLang}. Output ONLY the translation, no explanations:\n\n${text}`,
            },
          ],
        });

        if (translation.text) {
          return NextResponse.json({ text: translation.text });
        }
      } catch (err: any) {
        console.warn(`[translate] Failed with key #${i + 1}:`, err.message);
      }
    }

    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
