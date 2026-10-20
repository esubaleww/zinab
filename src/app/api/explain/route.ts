import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";
import { validateNumbers } from "@/lib/ai/validator";
import type { ComputedFacts } from "@/lib/facts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { facts, crop, placeLabel, question } = body;

    if (!facts || !crop) {
      return NextResponse.json(
        { error: "Missing facts or crop" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt(
            facts as ComputedFacts,
            crop,
            placeLabel,
            question,
          ),
        },
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0.3,
      max_tokens: 500,
      reasoning_effort: "low",
    });

    const aiText = completion.choices[0]?.message?.content?.trim() || "";
    const isValid = validateNumbers(
      aiText,
      facts as ComputedFacts,
      crop,
      placeLabel,
    );

    if (!isValid || !aiText) {
      return NextResponse.json({
        text: `Rain next 16 days: ${facts.rainNext16Mm} mm. Discuss with your local Development Agent.`,
        validationFailed: true,
      });
    }

    return NextResponse.json({ text: aiText });
  } catch (error: any) {
    console.error("[explain] FATAL ERROR:", error?.message || error);
    return NextResponse.json(
      { error: "AI service temporarily unavailable." },
      { status: 500 },
    );
  }
}
