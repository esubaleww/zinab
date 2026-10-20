import { useState } from "react";

export function useSpeakText() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = async (
    text: string,
    languageCode: "am-ET" | "om-ET" | "en-US" = "am-ET",
  ) => {
    if (!text) return;
    setIsSpeaking(true);

    try {
      let textToSpeak = text;
      if (languageCode !== "en-US") {
        const transRes = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            targetLang: languageCode === "am-ET" ? "Amharic" : "Afaan Oromo",
          }),
        });
        if (transRes.ok) {
          const transData = await transRes.json();
          textToSpeak = transData.text;
        }
      }

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, languageCode }),
      });

      if (!res.ok) throw new Error("TTS API failed");

      const data = await res.json();
      if (data.audioBase64) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
        };
        await audio.play();
      } else {
        throw new Error("No audio returned");
      }
    } catch (err) {
      console.warn("TTS failed, falling back to browser TTS:", err);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang =
        languageCode === "am-ET"
          ? "am"
          : languageCode === "om-ET"
            ? "om"
            : "en";
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return { speak, isSpeaking };
}
