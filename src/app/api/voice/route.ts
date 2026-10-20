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

async function transcribeAudio(buffer: Buffer): Promise<string> {
  for (let i = 0; i < genAIClients.length; i++) {
    try {
      const client = genAIClients[i];
      const transcription = await client.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: [
          {
            inlineData: {
              mimeType: "audio/wav",
              data: buffer.toString("base64"),
            },
          },
          {
            text: "Transcribe this audio exactly as spoken. Do not translate. Output only the transcribed text.",
          },
        ],
      });

      const parts = transcription.candidates?.[0]?.content?.parts || [];
      const transcriptPart = parts.find((p: any) => p.audioTranscription);

      const text =
        transcriptPart?.audioTranscription?.text || transcription.text || "";
      if (text) {
        console.log(`[voice] STT succeeded with key #${i + 1}`);
        return text;
      }
    } catch (err: any) {
      console.warn(`[voice] STT failed with key #${i + 1}:`, err.message);
    }
  }
  return "";
}

async function generateTTS(
  text: string,
  languageCode: string,
): Promise<string | null> {
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
        console.log(`[voice] TTS succeeded with key #${i + 1}`);
        return audioPart.inlineData.data;
      }
    } catch (err: any) {
      console.warn(`[voice] TTS failed with key #${i + 1}:`, err.message);
    }
  }
  return null; // All keys failed
}

// Helper for Translation with key rotation and retry
async function translateToAmharic(text: string): Promise<string> {
  for (let i = 0; i < genAIClients.length; i++) {
    const client = genAIClients[i];
    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const translation = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              text: `Translate the following English text to Amharic. Output ONLY the Amharic translation, no explanations:\n\n${text}`,
            },
          ],
        });
        if (translation.text) {
          console.log(`[voice] Translation succeeded with key #${i + 1}`);
          return translation.text;
        }
      } catch (err: any) {
        console.warn(
          `[voice] Translation failed (key #${i + 1}, attempt ${attempt + 1}):`,
          err.message,
        );
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }
  return text;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const facts = JSON.parse(formData.get("facts") as string);
    const crop = formData.get("crop") as string;
    const placeLabel = formData.get("placeLabel") as string;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    // --- 1. GEMINI STT ---
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const questionText = await transcribeAudio(buffer);

    console.log(
      "=== [voice] QUESTION ===",
      questionText || "(Could not transcribe)",
    );

    // --- 2. GROQ BRAIN ---
    let aiText = "";
    try {
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
        reasoning_effort: "low",
      });

      aiText = completion.choices[0]?.message?.content?.trim() || "";
    } catch (err: any) {
      console.error("[voice] Groq failed:", err.message);
      aiText =
        "Rain next 16 days: " +
        facts.rainNext16Mm +
        " mm. Discuss with your local Development Agent.";
    }

    const isValid = validateNumbers(
      aiText,
      facts as ComputedFacts,
      crop,
      placeLabel,
    );
    const safeEnglish = isValid
      ? aiText
      : `Rain next 16 days: ${facts.rainNext16Mm} mm. Discuss with your local Development Agent.`;

    console.log("=== [voice] ENGLISH ANSWER ===", safeEnglish);

    let finalAnswer = safeEnglish;

    const isAmharicQuestion = questionText
      ? /[\u1200-\u137F]/.test(questionText)
      : false;

    if (isAmharicQuestion) {
      console.log("[voice] Amharic detected. Translating...");
      finalAnswer = await translateToAmharic(safeEnglish);
    } else {
      console.log("[voice] English detected. Skipping translation.");
    }

    console.log("=== [voice] FINAL ANSWER ===", finalAnswer);

    // --- 4. GEMINI TTS ---
    const audioBase64 = await generateTTS(
      finalAnswer,
      isAmharicQuestion ? "am-ET" : "en-US",
    );

    return NextResponse.json({
      question: questionText || "Could not hear the question clearly.",
      answer: finalAnswer,
      audioBase64: audioBase64,
    });
  } catch (error: any) {
    console.error("[voice] FATAL ERROR:", error?.message || error);
    return NextResponse.json(
      { error: "Voice service failed" },
      { status: 500 },
    );
  }
}
