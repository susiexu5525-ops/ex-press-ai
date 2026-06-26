"use client";

import { useApp } from "./layout";
import TranslationPanel from "./components/TranslationPanel";
import ReviewPanel from "./components/ReviewPanel";
import { Languages, PenLine, Sparkles } from "lucide-react";

export default function Home() {
  const { state } = useApp();

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      {!state.translatedText && (
        <div className="bg-gradient-to-r from-brand-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles size={24} className="text-amber-300" />
            <h2 className="text-lg font-bold">
              高校外宣新闻 AI 翻译与审校工作台
            </h2>
          </div>
          <p className="text-blue-100 text-sm max-w-2xl">
            输入中文新闻稿 → AI 智能翻译 → 自动术语识别 → 规则强制校验 →
            审校批注反馈。一站式完成高校外宣材料的英文转化。
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-blue-200">
              <Languages size={14} />
              中→英翻译
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-200">
              <PenLine size={14} />
              智能审校
            </div>
            <div className="text-xs text-blue-200">
              术语自动识别 · 规则自动生效
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar (仅在翻译后显示) */}
      {state.translatedText && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            译文:
            <span className="font-medium text-slate-700">
              {state.translatedText.length}
            </span>
            字符
          </div>
          {state.detectedTerms.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              术语:
              <span className="font-medium text-slate-700">
                {state.detectedTerms.length}
              </span>
              个
            </div>
          )}
          {state.appliedRules.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              规则应用:
              <span className="font-medium text-slate-700">
                {state.appliedRules.length}
              </span>
              条
            </div>
          )}
          {state.annotations.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              审校批注:
              <span className="font-medium text-slate-700">
                {state.annotations.length}
              </span>
              条
            </div>
          )}
        </div>
      )}

      {/* Main Content: 左右分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：翻译面板 */}
        <div
          className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 
            ${
              state.activeTab === "translate"
                ? "ring-2 ring-brand-500/20"
                : ""
            }
            transition-all`}
        >
          <TranslationPanel />
        </div>

        {/* 右侧：审校面板 */}
        <div
          className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5
            ${
              state.activeTab === "review" ? "ring-2 ring-brand-500/20" : ""
            }
            transition-all`}
        >
          <ReviewPanel />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4">
        <p className="text-xs text-slate-300">
          ex·press·AI — 高校外宣新闻翻译与审校工具 | MVP v0.1 | 数据存储于本地浏览器
        </p>
      </footer>
    </div>
  );
}
