"use client";

import dynamic from "next/dynamic";

const EthiopiaMap = dynamic(() => import("./EthiopiaMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-[#e3e7df] text-sm text-[#748077]">
      Loading map…
    </div>
  ),
});

export default EthiopiaMap;
