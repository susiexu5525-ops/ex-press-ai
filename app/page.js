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

  // 在客户端挂载后才读取 localStorage，避免 SSR hydration 不匹配
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
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles size={24} className="text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-slate-800 tracking-tight">
          <span className="text-brand-600">ExPress</span>{" "}
          <span className="text-slate-500 font-light">AI</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">高校外宣新闻翻译与审校</p>
      </div>

      {/* 四个功能入口 — 2x2 网格 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <button
          onClick={() => goTo("/translate")}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-200 bg-white
            hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-0.5
            active:scale-[0.98] transition-all duration-200 group"
        >
          <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center
            group-hover:bg-brand-100 transition-colors">
            <Languages size={26} className="text-brand-600" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-700 group-hover:text-brand-700 transition-colors">
              翻译
            </div>
            <div className="text-xs text-slate-400 mt-0.5">中文 → 英文</div>
          </div>
        </button>

        <button
          onClick={() => goTo("/review")}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-200 bg-white
            hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5
            active:scale-[0.98] transition-all duration-200 group"
        >
          <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center
            group-hover:bg-amber-100 transition-colors">
            <PenLine size={26} className="text-amber-500" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-700 group-hover:text-amber-700 transition-colors">
              审校
            </div>
            <div className="text-xs text-slate-400 mt-0.5">批注式反馈</div>
          </div>
        </button>

        <button
          onClick={() => dispatch({ type: "TOGGLE_TERM_MANAGER" })}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-200 bg-white
            hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5
            active:scale-[0.98] transition-all duration-200 group"
        >
          <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center
            group-hover:bg-emerald-100 transition-colors relative">
            <BookOpen size={26} className="text-emerald-500" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold
              rounded-full flex items-center justify-center shadow-sm">
              {termCount}
            </span>
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
              术语库
            </div>
            <div className="text-xs text-slate-400 mt-0.5">自动识别高亮</div>
          </div>
        </button>

        <button
          onClick={() => dispatch({ type: "TOGGLE_RULE_MANAGER" })}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-200 bg-white
            hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5
            active:scale-[0.98] transition-all duration-200 group"
        >
          <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center
            group-hover:bg-purple-100 transition-colors relative">
            <ShieldCheck size={26} className="text-purple-500" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-[10px] font-bold
              rounded-full flex items-center justify-center shadow-sm">
              {ruleCount}
            </span>
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-700 group-hover:text-purple-700 transition-colors">
              规则库
            </div>
            <div className="text-xs text-slate-400 mt-0.5">强制规范生效</div>
          </div>
        </button>
      </div>
    </div>
  );
}
