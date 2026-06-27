"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  return (
    <header className="bg-[#f4f1ea]/90 border-b border-[#d8d2c2] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-center">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 select-none cursor-pointer hover:opacity-80 active:bg-[#e6dfd3] active:opacity-100 px-3 py-1.5 -mx-3 rounded-sm transition-all duration-150"
        >
          <div className="w-8 h-8 bg-[#5a4c3b] rounded flex items-center justify-center shadow-sm">
            <Sparkles size={16} className="text-[#f4f1ea]" />
          </div>
          <h1 className="text-lg font-bold text-[#3d3226] tracking-wide" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            <span>ExPress</span>
            <span className="font-normal ml-1 text-sm text-[#8c7b6a] tracking-wider" style={{ fontFamily: "'Courier New', monospace" }}>AI</span>
          </h1>
        </button>
      </div>
    </header>
  );
}
