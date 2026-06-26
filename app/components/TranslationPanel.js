"use client";

import { useApp } from "@/app/layout";
import { detectTerms, tokenizeWithTerms } from "@/lib/terminology";
import { translateWithDeepSeek } from "@/lib/deepseek";
import { applyRules } from "@/lib/rules";
import { mockReview } from "@/lib/mockAI";
import { addHistory } from "@/lib/storage";
import { Send, RotateCw, Trash2, Copy, Check, AlertCircle } from "lucide-react";
import { useState } from "react";

const SAMPLE_TEXT = `近年来，我校在国际化办学和人才培养方面取得了显著成效。作为双一流建设高校，学校深入推进产学研合作，着力培养高素质人才。日前，学校荣获国家级教学成果奖，标志着我校高质量教育迈上新台阶。`;

export default function TranslationPanel() {
  const { state, dispatch } = useApp();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleTranslate = async () => {
    if (!state.sourceText.trim()) return;

    setError("");
    dispatch({ type: "SET_IS_TRANSLATING", payload: true });
    dispatch({ type: "SET_TRANSLATED_TEXT", payload: "" });
    dispatch({ type: "SET_ANNOTATIONS", payload: [] });
    dispatch({ type: "SET_APPLIED_RULES", payload: [] });

    try {
      // 1. 术语检测
      const terms = detectTerms(state.sourceText);
      dispatch({ type: "SET_DETECTED_TERMS", payload: terms });

      // 2. 调用 DeepSeek API 进行真实翻译
      const translated = await translateWithDeepSeek(state.sourceText, terms);
      dispatch({ type: "SET_TRANSLATED_TEXT", payload: translated });

      dispatch({ type: "SET_IS_TRANSLATING", payload: false });

      // 3. 规则应用
      dispatch({ type: "SET_IS_REVIEWING", payload: true });
      const { finalText, appliedRules } = applyRules(translated);

      if (appliedRules.length > 0) {
        dispatch({ type: "SET_TRANSLATED_TEXT", payload: finalText });
        dispatch({ type: "SET_APPLIED_RULES", payload: appliedRules });
      }

      // 4. AI 审校
      const finalForReview = appliedRules.length > 0 ? finalText : translated;
      const annotations = await mockReview(finalForReview, appliedRules);
      dispatch({ type: "SET_ANNOTATIONS", payload: annotations });
      dispatch({ type: "SET_IS_REVIEWING", payload: false });

      // 5. 保存历史
      addHistory({
        source: state.sourceText,
        translated: finalForReview,
        terms,
        rules: appliedRules,
        annotations,
      });
    } catch (err) {
      dispatch({ type: "SET_IS_TRANSLATING", payload: false });
      dispatch({ type: "SET_IS_REVIEWING", payload: false });
      setError(err.message || "翻译失败，请稍后重试");
    }
  };

  const handleClear = () => {
    dispatch({ type: "RESET" });
  };

  const handleCopy = async () => {
    if (!state.translatedText) return;
    await navigator.clipboard.writeText(state.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFillSample = () => {
    dispatch({ type: "SET_SOURCE_TEXT", payload: SAMPLE_TEXT });
  };

  // 术语高亮渲染
  const tokens = tokenizeWithTerms(state.sourceText, state.detectedTerms);

  return (
    <div className="flex flex-col h-full">
      {/* 面板头部 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-500"></span>
          原文输入
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFillSample}
            className="text-xs text-brand-500 hover:text-brand-700 underline underline-offset-2"
          >
            填入示例
          </button>
          {state.detectedTerms.length > 0 && (
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              {state.detectedTerms.length} 个术语
            </span>
          )}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="relative flex-1 min-h-0">
        <textarea
          value={state.sourceText}
          onChange={(e) =>
            dispatch({ type: "SET_SOURCE_TEXT", payload: e.target.value })
          }
          placeholder="请输入中文新闻稿内容..."
          className="translate-input w-full h-full min-h-[300px] p-4 border border-slate-200 rounded-xl
            bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400
            text-slate-700 placeholder:text-slate-300 transition-all"
          spellCheck={false}
        />

        {/* 术语高亮覆盖层（仅在非编辑态显示） */}
        {state.detectedTerms.length > 0 && state.sourceText && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-100 px-4 py-2 rounded-b-xl">
            <div className="flex flex-wrap gap-1.5">
              {state.detectedTerms.map((term) => (
                <span
                  key={`${term.id}-${term.start}`}
                  className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 cursor-help"
                  title={`${term.zh} → ${term.en}`}
                >
                  <span className="text-amber-500">◆</span>
                  {term.zh}
                  <span className="text-amber-400">→</span>
                  <span className="text-amber-600 font-medium">{term.en}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={!state.sourceText}
          >
            <Trash2 size={14} />
            清空
          </button>
        </div>

        <div className="flex items-center gap-2">
          {state.translatedText && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {copied ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} />
              )}
              {copied ? "已复制" : "复制译文"}
            </button>
          )}

          <button
            onClick={handleTranslate}
            disabled={!state.sourceText.trim() || state.isTranslating}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium
              rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {state.isTranslating ? (
              <>
                <RotateCw size={16} className="animate-spin" />
                翻译中...
              </>
            ) : (
              <>
                <Send size={16} />
                AI 翻译
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
