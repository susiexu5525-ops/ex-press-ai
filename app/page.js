"use client";

import { useRouter } from "next/navigation";
import { Languages, PenLine, BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import { useApp } from "./components/AppProvider";
import { getTerms, getRules } from "@/lib/storage";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [termCount, setTermCount] = useState(0);
  const [ruleCount, setRuleCount] = useState(0);

  useEffect(() => {
    setTermCount(getTerms().length);
    setRuleCount(getRules().length);
  }, []);

  const goTo = (path) => {
    router.push(path);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] w-full">
      {/* 主标题 */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles size={26} className="text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
          <span className="text-blue-600">ExPress</span>{" "}
          <span className="text-slate-400 font-light text-xl">AI</span>
        </h1>
        <p className="text-slate-400 text-sm mt-3 tracking-wide">
          高校外宣新闻翻译与审校
        </p>
      </div>

      {/* 四个功能入口 — 2x2 网格 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {/* 翻译 */}
        <button
          onClick={() => goTo("/translate")}
          className="flex flex-col items-center gap-3 p-6 rounded-sm border border-[#e2dec9] bg-[#faf8f5] text-slate-800
            shadow-[0_2px_10px_rgba(0,0,0,0.06)]
            hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]
            transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-sm bg-[#F06EA9]/10 flex items-center justify-center">
            <Languages size={24} className="text-[#F06EA9]" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-[#3d3226] text-sm font-mono">翻译</div>
            <div className="text-xs text-[#8c7b6a] mt-0.5 tracking-wider" style={{ fontFamily: "SimSun, STSong, serif" }}>中文 → 英文</div>
          </div>
        </button>

        {/* 审校 */}
        <button
          onClick={() => goTo("/review")}
          className="flex flex-col items-center gap-3 p-6 rounded-sm border border-[#e2dec9] bg-[#faf8f5] text-slate-800
            shadow-[0_2px_10px_rgba(0,0,0,0.06)]
            hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]
            transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-sm bg-[#29ABE2]/10 flex items-center justify-center">
            <PenLine size={24} className="text-[#29ABE2]" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-[#3d3226] text-sm font-mono">审校</div>
            <div className="text-xs text-[#8c7b6a] mt-0.5 tracking-wider" style={{ fontFamily: "SimSun, STSong, serif" }}>批注式反馈</div>
          </div>
        </button>

        {/* 术语库 */}
        <button
          onClick={() => dispatch({ type: "TOGGLE_TERM_MANAGER" })}
          className="flex flex-col items-center gap-3 p-6 rounded-sm border border-[#e2dec9] bg-[#faf8f5] text-slate-800
            shadow-[0_2px_10px_rgba(0,0,0,0.06)]
            hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]
            transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-sm bg-[#FFDE17]/15 flex items-center justify-center relative">
            <BookOpen size={24} className="text-[#C4A900]" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c85a3e] text-[#faf8f5] text-[10px] font-bold
              rounded-full flex items-center justify-center shadow-sm" style={{ fontFamily: "'Courier New', monospace" }}>
              {termCount}
            </span>
          </div>
          <div className="text-center">
            <div className="font-semibold text-[#3d3226] text-sm font-mono">术语库</div>
            <div className="text-xs text-[#8c7b6a] mt-0.5 tracking-wider" style={{ fontFamily: "SimSun, STSong, serif" }}>自动识别高亮</div>
          </div>
        </button>

        {/* 规则库 */}
        <button
          onClick={() => dispatch({ type: "TOGGLE_RULE_MANAGER" })}
          className="flex flex-col items-center gap-3 p-6 rounded-sm border border-[#e2dec9] bg-[#faf8f5] text-slate-800
            shadow-[0_2px_10px_rgba(0,0,0,0.06)]
            hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]
            transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-sm bg-[#00A99D]/10 flex items-center justify-center relative">
            <ShieldCheck size={24} className="text-[#00A99D]" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c85a3e] text-[#faf8f5] text-[10px] font-bold
              rounded-full flex items-center justify-center shadow-sm" style={{ fontFamily: "'Courier New', monospace" }}>
              {ruleCount}
            </span>
          </div>
          <div className="text-center">
            <div className="font-semibold text-[#3d3226] text-sm font-mono">规则库</div>
            <div className="text-xs text-[#8c7b6a] mt-0.5 tracking-wider" style={{ fontFamily: "SimSun, STSong, serif" }}>强制规范生效</div>
          </div>
        </button>
      </div>
    </div>
  );
}
