import { useState, useRef, useCallback } from "react";
import type { ComputedFacts } from "../facts";

export function useVoiceAssistant(
  facts: ComputedFacts | null,
  crop: string,
  placeLabel: string,
) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setQuestion(null);
      setAnswer(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Mic access failed:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  }, [facts, crop, placeLabel]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processAudio = async (audioBlob: Blob) => {
    if (!facts) return;
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("audio", audioBlob, "query.wav");
    formData.append("facts", JSON.stringify(facts));
    formData.append("crop", crop);
    formData.append("placeLabel", placeLabel);

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      setQuestion(data.question);
      setAnswer(data.answer);

      if (data.audioBase64) {
        try {
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "audio/wav" });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => URL.revokeObjectURL(url);
          await audio.play().catch(() => fallbackToBrowserTTS(data.answer));
        } catch (e) {
          fallbackToBrowserTTS(data.answer);
        }
      } else {
        fallbackToBrowserTTS(data.answer);
      }
    } catch (err: any) {
      console.error("Voice API failed:", err);
      setError("Voice service unavailable. Please try typing.");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isRecording,
    isProcessing,
    question,
    answer,
    error,
    startRecording,
    stopRecording,
  };
}

function fallbackToBrowserTTS(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "am-ET";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
