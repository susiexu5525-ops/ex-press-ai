"use client";

import { useApp } from "@/app/components/AppProvider";
import { detectTerms } from "@/lib/terminology";
import { applyRules } from "@/lib/rules";
import { mockReview } from "@/lib/mockAI";
import { tokenizeWithAnnotations } from "@/lib/annotations";
import { addHistory } from "@/lib/storage";
import {
  ArrowLeft,
  RotateCw,
  Send,
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const severityConfig = {
  error: {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50 border-red-200",
    label: "错误",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
    label: "警告",
  },
  info: {
    icon: Info,
    color: "text-green-500",
    bg: "bg-green-50 border-green-200",
    label: "规则",
  },
  suggestion: {
    icon: Lightbulb,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    label: "建议",
  },
};

export default function ReviewPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [expandedAnnotations, setExpandedAnnotations] = useState({});
  const [error, setError] = useState("");

  const toggleAnnotation = (id) => {
    setExpandedAnnotations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleReview = async () => {
    if (!state.sourceText.trim() && !state.translatedText.trim()) {
      setError("请至少输入中文原文或英文译文");
      return;
    }

    setError("");
    dispatch({ type: "SET_IS_REVIEWING", payload: true });
    dispatch({ type: "SET_ANNOTATIONS", payload: [] });
    dispatch({ type: "SET_APPLIED_RULES", payload: [] });

    try {
      // 1. 如果输入了中文，做术语检测
      if (state.sourceText.trim()) {
        const terms = detectTerms(state.sourceText);
        dispatch({ type: "SET_DETECTED_TERMS", payload: terms });
      }

      // 2. 规则应用
      const textToReview = state.translatedText || state.sourceText;
      const { finalText, appliedRules } = applyRules(textToReview);

      if (appliedRules.length > 0) {
        dispatch({ type: "SET_APPLIED_RULES", payload: appliedRules });
        if (state.translatedText) {
          dispatch({ type: "SET_TRANSLATED_TEXT", payload: finalText });
        }
      }

      // 3. AI 审校
      const annotations = await mockReview(finalText, appliedRules);
      dispatch({ type: "SET_ANNOTATIONS", payload: annotations });

      // 4. 保存历史
      addHistory({
        source: state.sourceText,
        translated: finalText,
        terms: state.detectedTerms,
        rules: appliedRules,
        annotations,
      });

      dispatch({ type: "SET_IS_REVIEWING", payload: false });
    } catch (err) {
      dispatch({ type: "SET_IS_REVIEWING", payload: false });
      setError(err.message || "审校失败，请稍后重试");
    }
  };

  const handleClear = () => {
    dispatch({ type: "RESET" });
    setError("");
    setExpandedAnnotations({});
  };

  const handleCopyFromTranslate = () => {
    // 从翻译页带来的状态已经存在 state.translatedText 中
    // 用户也可手动粘贴英文译文
  };

  // 审校批注高亮渲染
  const tokens = tokenizeWithAnnotations(
    state.translatedText,
    state.annotations
  );

  // 统计
  const stats = {
    error: state.annotations.filter((a) => a.severity === "error").length,
    warning: state.annotations.filter((a) => a.severity === "warning").length,
    info: state.annotations.filter((a) => a.severity === "info").length,
    suggestion: state.annotations.filter((a) => a.severity === "suggestion")
      .length,
  };

  return (
    <div className="w-full space-y-6">
      {/* 顶部返回 */}
      <button
        onClick={() => router.push("/")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={16} />
        返回首页
      </button>

      {/* 标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md shadow-orange-500/20">
          <Lightbulb size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">AI 审校</h1>
          <p className="text-xs text-slate-400">批注式反馈 · 规则校验</p>
        </div>
      </div>

      {/* 中文原文输入 — 横向长方形，单列居中 */}
      <div className="bg-[#faf8f5] rounded-sm border border-[#e2dec9] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#3d3226] flex items-center gap-2 font-mono tracking-wide">
            <span className="w-2 h-2 bg-[#5a4c3b]"></span>
            中文原文
          </h2>
          <span className="text-xs text-[#b8b09c]">可选</span>
        </div>
        <textarea
          value={state.sourceText}
          onChange={(e) =>
            dispatch({ type: "SET_SOURCE_TEXT", payload: e.target.value })
          }
          placeholder="输入中文原文（可选，用于术语参考）..."
          rows={6}
          className="w-full p-5 border border-[#e2dec9] rounded-sm
            bg-[#f4f1ea] focus:outline-none focus:border-[#c9c1ad]
            text-[#3d3226] placeholder:text-[#b8b09c] transition-colors"
          style={{ fontFamily: "SimSun, STSong, serif" }}
          spellCheck={false}
        />

        {/* 检测到的术语 */}
        {state.detectedTerms.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {state.detectedTerms.map((term) => (
              <span
                key={`${term.id}-${term.start}`}
                className="inline-flex items-center gap-1 text-xs bg-[#fdf9e7] text-[#3d3226] px-2 py-0.5 rounded-sm border border-[#e8dba0]"
              >
                {term.zh} → {term.en}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 英文译文输入 — 横向长方形，单列居中 */}
      <div className="bg-[#faf8f5] rounded-sm border border-[#e2dec9] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#3d3226] flex items-center gap-2 font-mono tracking-wide">
            <span className="w-2 h-2 bg-[#4a6b5d]"></span>
            英文译文
          </h2>
          {state.translatedText ? (
            <span className="text-xs text-[#4a6b5d] font-medium font-mono">
              已就绪
            </span>
          ) : (
            <span className="text-xs text-[#b8b09c]">可粘贴或从翻译页带入</span>
          )}
        </div>
        <textarea
          value={state.translatedText}
          onChange={(e) =>
            dispatch({
              type: "SET_TRANSLATED_TEXT",
              payload: e.target.value,
            })
          }
          placeholder="输入或粘贴英文译文..."
          rows={8}
          className="w-full p-5 border border-[#e2dec9] rounded-sm
            bg-[#f4f1ea] focus:outline-none focus:border-[#c9c1ad]
            text-[#3d3226] placeholder:text-[#b8b09c] transition-colors font-mono"
          spellCheck={false}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-[#fdf0ed] rounded-sm border border-[#e8c4bc] text-[#8c4a32] text-xs">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8c7b6a] hover:text-[#5a4c3b] hover:bg-[#f4f1ea] rounded-sm transition-colors"
        >
          <Trash2 size={14} />
          清空
        </button>

        <button
          onClick={handleReview}
          disabled={
            state.isReviewing ||
            (!state.sourceText.trim() && !state.translatedText.trim())
          }
          className="flex items-center gap-2 px-6 py-2.5 bg-[#8c4a32] text-[#faf8f5] text-sm font-medium font-mono
            rounded-sm hover:bg-[#6b3826] disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors shadow-sm active:translate-y-px"
        >
          {state.isReviewing ? (
            <>
              <RotateCw size={16} className="animate-spin" />
              审校中...
            </>
          ) : (
            <>
              <Send size={16} />
              开始审校
            </>
          )}
        </button>
      </div>

      {/* 审校结果 — 单列居中 */}
      <div className="bg-[#f4f1ea] rounded-sm border border-[#e2dec9] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#3d3226] flex items-center gap-2 font-mono tracking-wide">
            <span className="w-2 h-2 bg-[#8c4a32]"></span>
            审校结果
          </h2>
          {state.isReviewing && (
            <span className="text-xs text-[#8c7b6a] animate-pulse font-mono">
              分析中...
            </span>
          )}
        </div>

        {state.annotations.length > 0 && state.translatedText ? (
          <>
            {/* 批注高亮译文 */}
            <div className="w-full min-h-[160px] max-h-[360px] p-5 border border-[#e2dec9] rounded-sm
              bg-[#faf8f5] overflow-auto leading-relaxed text-[16px] text-[#3d3226] mb-5 font-mono">
              {tokens.map((token, i) => {
                if (token.type === "text") {
                  return <span key={i}>{token.content}</span>;
                }
                const annotation = token.annotation;
                const cfg = severityConfig[annotation.severity] || {};
                const Icon = cfg.icon;

                return (
                  <span
                    key={i}
                    className={`annotation-mark ${annotation.severity} relative group cursor-pointer`}
                    onClick={() => toggleAnnotation(annotation.id)}
                  >
                    {token.content}
                    {/* Tooltip */}
                    <div
                      className={`
                        absolute bottom-full left-0 mb-2 w-72 p-3 rounded-sm shadow-lg border z-50
                        ${cfg.bg || "bg-[#faf8f5] border-[#e2dec9]"}
                        transition-all duration-200
                        ${
                          expandedAnnotations[annotation.id]
                            ? "opacity-100 translate-y-0 pointer-events-auto"
                            : "opacity-0 translate-y-1 pointer-events-none"
                        }
                      `}
                    >
                      <div className="flex items-start gap-2">
                        {Icon && <Icon size={16} className={cfg.color} />}
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-semibold mb-1 font-mono ${cfg.color}`}>
                            {cfg.label}
                          </div>
                          <p className="text-xs text-[#3d3226] leading-relaxed mb-2">
                            {annotation.comment}
                          </p>
                          {annotation.suggestion && (
                            <div className="p-2 bg-[#f4f1ea] rounded-sm border border-[#e2dec9]">
                              <p className="text-xs text-[#8c7b6a] mb-0.5">建议：</p>
                              <p className="text-xs text-[#5a4c3b] font-medium font-mono">
                                {annotation.suggestion}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </span>
                );
              })}
            </div>

            {/* 批注列表 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-[#3d3226] font-mono">
                  批注列表 ({state.annotations.length})
                </h3>
                <div className="flex items-center gap-1.5">
                  {stats.error > 0 && (
                    <span className="text-[10px] text-[#8c4a32] bg-[#fdf0ed] px-1.5 py-0.5 rounded-sm font-mono">
                      错误 {stats.error}
                    </span>
                  )}
                  {stats.warning > 0 && (
                    <span className="text-[10px] text-[#8c7b6a] bg-[#fdf9e7] px-1.5 py-0.5 rounded-sm font-mono">
                      警告 {stats.warning}
                    </span>
                  )}
                  {stats.info > 0 && (
                    <span className="text-[10px] text-[#4a6b5d] bg-[#f2f5f3] px-1.5 py-0.5 rounded-sm font-mono">
                      规则 {stats.info}
                    </span>
                  )}
                  {stats.suggestion > 0 && (
                    <span className="text-[10px] text-[#5a4a6b] bg-[#f4f1f5] px-1.5 py-0.5 rounded-sm font-mono">
                      建议 {stats.suggestion}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {state.annotations.map((annotation) => {
                  const cfg = severityConfig[annotation.severity] || {};
                  const Icon = cfg.icon;
                  const isExpanded = expandedAnnotations[annotation.id];

                  return (
                    <div
                      key={annotation.id}
                      className={`p-2.5 rounded-sm border text-xs ${cfg.bg} cursor-pointer transition-colors hover:shadow-sm`}
                      onClick={() => toggleAnnotation(annotation.id)}
                    >
                      <div className="flex items-start gap-2">
                        {Icon && (
                          <Icon size={14} className={`${cfg.color} mt-0.5`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium font-mono ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <ChevronDown
                              size={14}
                              className={`text-[#b8b09c] transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                          <p className="text-[#5a4c3b] mt-0.5">
                            {annotation.comment}
                          </p>
                          {isExpanded && annotation.suggestion && (
                            <div className="mt-2 p-2 bg-[#faf8f5] rounded-sm border border-[#e2dec9]">
                              <p className="text-[#8c7b6a] mb-0.5">修改建议：</p>
                              <p className="text-[#5a4c3b] font-medium font-mono">
                                {annotation.suggestion}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[240px] text-center border border-dashed border-[#d8d2c2] rounded-sm bg-[#faf8f5]">
            {state.isReviewing ? (
              <div className="flex items-center gap-2 text-[#8c7b6a]">
                <RotateCw size={18} className="animate-spin" />
                <span className="text-sm font-mono">审校中...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-[#f4f1ea] rounded-sm flex items-center justify-center mb-3 border border-[#e2dec9]">
                  <span className="text-xl">🔍</span>
                </div>
                <p className="text-[#8c7b6a] text-sm">审校结果将在此显示</p>
                <p className="text-[#b8b09c] text-xs mt-1" style={{ fontFamily: "SimSun, STSong, serif" }}>
                  输入中文原文和英文译文后点击「开始审校」
                </p>
              </>
            )}
          </div>
        )}

        {/* 规则应用摘要 */}
        {state.appliedRules.length > 0 && (
          <div className="mt-4 p-3 bg-[#f2f5f3] rounded-sm border border-[#d0d9d3]">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#3d5a4a] mb-2 font-mono">
              <CheckCircle2 size={14} />
              规则自动应用 ({state.appliedRules.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {state.appliedRules.map((rule) => (
                <span
                  key={rule.id}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm
                    bg-[#faf8f5] text-[#3d3226] border border-[#e2dec9]"
                >
                  {rule.name}
                  <span className="text-[#b8b09c]">|</span>
                  <span className="line-through text-[#b8b09c] text-[10px]">
                    {rule.original}
                  </span>
                  <span>→</span>
                  <span className="font-medium font-mono">{rule.replaced}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
