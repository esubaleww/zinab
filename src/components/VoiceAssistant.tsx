"use client";

import { Icon } from "@/components/Icon";
import { useVoiceAssistant } from "@/lib/hooks/useVoiceAssistant";
import type { ComputedFacts } from "@/lib/facts";

interface Props {
  facts: ComputedFacts | null;
  crop: string;
  placeLabel: string;
}

export default function VoiceAssistant({ facts, crop, placeLabel }: Props) {
  const voice = useVoiceAssistant(facts, crop, placeLabel);

  return (
    <div className="my-8 rounded-3xl bg-[#f0f2e9] px-5 py-8 text-center">
      <button
        onClick={() => {
          if (voice.isRecording) {
            voice.stopRecording();
          } else {
            voice.startRecording();
          }
        }}
        disabled={voice.isProcessing}
        className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-white shadow-xl transition ${
          voice.isRecording
            ? "scale-105 bg-[#c65b49] shadow-[#c65b49]/25"
            : voice.isProcessing
              ? "bg-[#a0a0a0] cursor-not-allowed"
              : "bg-[#245a43] shadow-[#245a43]/25 hover:scale-105"
        }`}
        aria-label="Ask Zinab by voice"
      >
        <Icon name="mic" size={34} />
      </button>
      <p className="mt-5 font-semibold">
        {voice.isRecording
          ? "Listening…"
          : voice.isProcessing
            ? "Zinab is thinking…"
            : "Tap to ask by voice"}
      </p>
      <p className="mt-1 text-sm text-[#7d8981]">
        {voice.isRecording
          ? "Ask about rain, soil, or your crop"
          : "Amharic · Afaan Oromo · English"}
      </p>
      {voice.isRecording && (
        <div className="mx-auto mt-5 flex h-6 w-36 items-center justify-center gap-1">
          {[10, 20, 14, 24, 17, 9, 21, 13].map((h, i) => (
            <span
              key={i}
              className="w-1 animate-pulse rounded-full bg-[#c65b49]"
              style={{ height: h }}
            />
          ))}
        </div>
      )}

      {voice.question && (
        <div className="mt-6 rounded-xl bg-white/60 p-3 text-left text-sm">
          <span className="font-semibold text-[#173d2d]">You asked:</span>
          <p className="text-[#4a5a51]">{voice.question}</p>
        </div>
      )}
      {voice.answer && (
        <div className="mt-2 rounded-xl bg-[#173d2d] p-3 text-left text-sm text-white">
          <span className="font-semibold text-[#e1f06a]">Zinab says:</span>
          <p className="mt-1 text-white/80">{voice.answer}</p>
        </div>
      )}
      {voice.error && (
        <p className="mt-4 text-xs text-red-600">{voice.error}</p>
      )}
    </div>
  );
}
