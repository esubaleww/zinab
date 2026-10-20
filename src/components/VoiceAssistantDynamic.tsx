"use client";

import dynamic from "next/dynamic";

const VoiceAssistant = dynamic(() => import("./VoiceAssistant"), {
  ssr: false,
  loading: () => (
    <div className="my-8 rounded-3xl bg-[#f0f2e9] px-5 py-8 text-center">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#245a43] text-white opacity-50">
        <span className="text-xs">Loading…</span>
      </div>
    </div>
  ),
});

export default VoiceAssistant;
