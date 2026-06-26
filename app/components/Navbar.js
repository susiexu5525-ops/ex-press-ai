"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-center">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 select-none cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-blue-400 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">
            <span className="text-brand-600">ExPress</span>
            <span className="text-slate-400 font-light ml-1">AI</span>
          </h1>
        </button>
      </div>
    </header>
  );
}
