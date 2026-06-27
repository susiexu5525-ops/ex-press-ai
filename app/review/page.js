"use client";

import { useApp } from "@/app/components/AppProvider";
import { detectTerms } from "@/lib/terminology";
import { applyRules } from "@/lib/rules";
import { mockReview } from "@/lib/mockAI";
import { addHistory } from "@/lib/storage";
import {
  RotateCw,
  Send,
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const severityConfig = {
  error: {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50 border-red-200",
    label: "错误",
    category: "语法问题",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
    label: "警告",
    category: "不自然表达",
  },
  info: {
    icon: Info,
    color: "text-green-500",
    bg: "bg-green-50 border-green-200",
    label: "规则",
    category: "术语一致性",
  },
  suggestion: {
    icon: Lightbulb,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    label: "建议",
    category: "原文对应问题",
  },
};

/** 分类中文标签 */
const categoryLabels = {
  "术语一致性": "术语一致性",
  "语法问题": "语法问题",
  "不自然表达": "不自然表达",
  "原文对应问题": "原文对应问题",
};

export default function ReviewPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [error, setError] = useState("");
  const [activeAnnotationId, setActiveAnnotationId] = useState(null);
  const [reviewExecuted, setReviewExecuted] = useState(false);
  const [corpusError, setCorpusError] = useState("");
  const sourceRef = useRef(null);
  const targetRef = useRef(null);
  const fileInputRef = useRef(null);

  // ============ 参考语料上传 ============
  const handleFileUpload = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setCorpusError("");

      const ext = file.name.split(".").pop()?.toLowerCase();

      // 仅支持 .txt
      if (ext !== "txt") {
        setCorpusError(
          ext === "docx"
            ? "暂不支持 .docx 格式，请转换为 .txt 后上传"
            : ext === "pdf"
            ? "暂不支持 .pdf 格式，请转换为 .txt 后上传"
            : `暂不支持 .${ext} 格式，请使用 .txt 文件`
        );
        // 重置 input 以便重新选择同一文件
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        if (typeof content !== "string" || !content.trim()) {
          setCorpusError("文件内容为空，请检查文件");
          return;
        }

        dispatch({
          type: "SET_REFERENCE_CORPUS",
          payload: {
            name: file.name,
            content: content.trim(),
          },
        });
      };
      reader.onerror = () => {
        setCorpusError("文件读取失败，请重试");
      };
      reader.readAsText(file, "UTF-8");

      // 重置 input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [dispatch]
  );

  const handleClearCorpus = useCallback(() => {
    dispatch({ type: "CLEAR_REFERENCE_CORPUS" });
    setCorpusError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [dispatch]);

  // ============ 核心操作：执行审校 ============
  const handleReview = async () => {
    if (!state.sourceText.trim()) {
      setError("请输入中文原文");
      return;
    }
    if (!state.translatedText.trim()) {
      setError("请输入英文译文");
      return;
    }

    setError("");

    // 术语检测
    const terms = detectTerms(state.sourceText);
    dispatch({ type: "SET_DETECTED_TERMS", payload: terms });

    dispatch({ type: "SET_IS_REVIEWING", payload: true });
    dispatch({ type: "SET_ANNOTATIONS", payload: [] });
    dispatch({ type: "SET_APPLIED_RULES", payload: [] });

    try {
      const { finalText, appliedRules } = applyRules(state.translatedText);

      if (appliedRules.length > 0) {
        dispatch({ type: "SET_APPLIED_RULES", payload: appliedRules });
        dispatch({ type: "SET_TRANSLATED_TEXT", payload: finalText });
      }

      const annotations = await mockReview(
        finalText,
        appliedRules,
        state.referenceCorpus
      );
      dispatch({ type: "SET_ANNOTATIONS", payload: annotations });

      // 一次性生成 segments
      dispatch({ type: "SET_SEGMENTS" });

      addHistory({
        source: state.sourceText,
        translated: finalText,
        terms: state.detectedTerms,
        rules: appliedRules,
        annotations,
      });

      dispatch({ type: "SET_IS_REVIEWING", payload: false });
      setReviewExecuted(true);
    } catch (err) {
      dispatch({ type: "SET_IS_REVIEWING", payload: false });
      setError(err.message || "审校失败，请稍后重试");
    }
  };

  const handleClear = () => {
    dispatch({ type: "RESET" });
    setError("");
    setActiveAnnotationId(null);
    setReviewExecuted(false);
  };

  // ============ 批注点击：高亮对应文本 ============
  const handleAnnotationClick = useCallback((annotation) => {
    setActiveAnnotationId((prev) =>
      prev === annotation.id ? null : annotation.id
    );
  }, []);

  // ============ 编辑 segment target ============
  const handleSegmentTargetChange = (segmentId, newTarget) => {
    dispatch({
      type: "UPDATE_SEGMENT_TARGET",
      payload: { segmentId, newTarget },
    });
  };

  // ============ 右侧批注按分类分组 ============
  const groupedAnnotations = {};

  // 从 segments 中汇总所有批注
  const allAnnotations = [];
  const seenIds = new Set();
  for (const seg of state.segments) {
    for (const a of seg.annotations) {
      if (!seenIds.has(a.id)) {
        seenIds.add(a.id);
        allAnnotations.push(a);
      }
    }
  }

  // 也包含不在 segments 中的 annotations（fallback）
  for (const a of state.annotations) {
    if (!seenIds.has(a.id)) {
      seenIds.add(a.id);
      allAnnotations.push(a);
    }
  }

  for (const a of allAnnotations) {
    const cfg = severityConfig[a.severity] || severityConfig.info;
    const cat = cfg.category;
    if (!groupedAnnotations[cat]) groupedAnnotations[cat] = [];
    groupedAnnotations[cat].push(a);
  }

  const categoryOrder = [
    "术语一致性",
    "语法问题",
    "不自然表达",
    "原文对应问题",
  ];

  const totalAnnotations = allAnnotations.length;
  const hasAnnotations = totalAnnotations > 0;

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden flex flex-col p-6 bg-[#EFECE4] box-border z-0">
      {/* 全局复古多重碎纸拼贴背景 */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10rem] left-[10%] w-[45vw] h-[25rem] bg-[#db5d8f] rounded-[30%_70%_40%_60%/_50%_30%_70%_50%] opacity-90" />
        <div className="absolute top-[-5rem] left-[-10rem] w-[35vw] h-[35rem] bg-[#d94e1d] rounded-[40%_60%_30%_70%/_60%_40%_70%_30%] opacity-95" />
        <div className="absolute top-[-8rem] right-[-10rem] w-[50vw] h-[45rem] bg-[#2496c7] rounded-[50%_50%_30%_70%/_40%_60%_40%_60%] opacity-90" />
        <div className="absolute bottom-[-12rem] left-[-5rem] w-[45vw] h-[45rem] bg-[#e6c412] rounded-[70%_30%_60%_40%/_50%_50%_60%_40%] opacity-95" />
        <div className="absolute bottom-[-10rem] right-[-8rem] w-[50vw] h-[45rem] bg-[#008f85] rounded-[40%_60%_50%_50%/_60%_40%_60%_40%] opacity-90" />
      </div>

      {/* 左上角 Header */}
      <div className="flex flex-col gap-3 flex-shrink-0 mb-4 select-none">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#fbf9f3] bg-[#2c241c]/60 hover:bg-[#2c241c]/90 px-2.5 py-1 rounded-sm w-fit shadow-sm backdrop-blur-sm border border-white/10 transition-all active:scale-95"
        >
          <span>←</span> BACK TO DESK
        </button>

        <div className="bg-[#fbf9f3]/90 border border-[#decfa6]/50 shadow-md p-3 py-2.5 rounded-[4px_10px_3px_6px] max-w-xs flex items-center gap-3 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#db5d8f]" />
          <div className="w-10 h-10 bg-[#2c241c] rounded-md flex items-center justify-center text-[#decfa6] flex-shrink-0 shadow-inner">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="font-serif font-black text-[#2c241c] text-xl tracking-wider flex items-center gap-1">
              AI 审校 <span className="font-sans text-xs text-[#8c7e6c] italic font-light lowercase">review</span>
            </h1>
            <p className="font-mono text-[10px] tracking-widest text-[#7c6e5c] uppercase mt-0.5">
              双栏 CAT 编辑 · 原文译文对照
            </p>
          </div>
        </div>

        {/* ===== 参考语料上传区域 ===== */}
        <div className="bg-[#fbf9f3]/90 border border-[#decfa6]/50 shadow-md p-3 py-2 rounded-[4px_10px_3px_6px] w-fit backdrop-blur-sm">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 隐藏的文件 input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* 上传按钮 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#5a4c3b] bg-[#f4f1ea] hover:bg-[#e8e4d8] border border-[#decfa6]/60 rounded-sm transition-colors active:scale-95"
              title="上传英文论文作为参考语料"
            >
              <Upload size={14} />
              <span className="hidden sm:inline">参考语料上传</span>
              <span className="sm:hidden">语料</span>
            </button>

            {/* 已上传状态 */}
            {state.referenceCorpus ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-[#3d3226] font-mono bg-[#f2f5f3] px-2 py-1 rounded-sm border border-[#c4d4c0]">
                  <FileText size={12} className="text-[#4a6b5d]" />
                  <span className="max-w-[200px] truncate" title={state.referenceCorpus.name}>
                    {state.referenceCorpus.name}
                  </span>
                </span>
                <button
                  onClick={handleClearCorpus}
                  className="flex items-center justify-center w-5 h-5 rounded-sm text-[#8c7b6a] hover:text-[#c85a3e] hover:bg-[#fdf0ed] transition-colors"
                  title="移除参考语料"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-[#b8b09c] font-mono tracking-wide hidden sm:inline">
                .txt 英文论文
              </span>
            )}
          </div>

          {/* 上传错误提示 */}
          {corpusError && (
            <div className="mt-2 flex items-start gap-1.5 p-2 bg-[#fdf0ed] rounded-sm border border-[#e8c4bc] text-[#8c4a32] text-[10px]">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>{corpusError}</span>
            </div>
          )}
        </div>
      </div>

      {/* ============ 主工作区：双栏布局 ============ */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* ===== 左侧区域 70%：原文 + 译文编辑 ===== */}
        <div className="w-[70%] flex flex-col gap-4 min-h-0">
          <div className="flex-1 bg-[#fbf9f3] border border-[#e3ded0] rounded-[6px_12px_8px_10px] shadow-[3px_6px_20px_rgba(61,50,38,0.1)] flex flex-col p-5 overflow-y-auto min-h-0">
            {/* 中文原文输入区 */}
            <div className="mb-5 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#3d3226] flex items-center gap-2 font-mono tracking-wide">
                  <span className="w-2 h-2 bg-[#5a4c3b]"></span>
                  中文原文
                </h2>
                {state.detectedTerms.length > 0 && (
                  <span className="text-[10px] text-[#8c7b6a] font-mono">
                    检测到 {state.detectedTerms.length} 个术语
                  </span>
                )}
              </div>
              <textarea
                ref={sourceRef}
                value={state.sourceText}
                onChange={(e) =>
                  dispatch({ type: "SET_SOURCE_TEXT", payload: e.target.value })
                }
                placeholder="输入中文原文..."
                rows={6}
                className="w-full p-5 border border-[#decfa6]/60 rounded-sm
                  bg-[#fdfcf7] focus:outline-none focus:border-[#c9c1ad]
                  text-[#3d3226] placeholder:text-[#b8b09c] transition-colors
                  shadow-[inset_1px_2px_6px_rgba(210,193,155,0.2)]"
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

            {/* 分隔线 */}
            <div className="flex items-center gap-3 mb-5 flex-shrink-0">
              <div className="h-px flex-1 bg-[#e3ded0]" />
              <span className="font-mono text-[10px] tracking-widest text-[#b8b09c] uppercase">Translation</span>
              <div className="h-px flex-1 bg-[#e3ded0]" />
            </div>

            {/* 英文译文输入区 */}
            <div className="mb-5 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#3d3226] flex items-center gap-2 font-mono tracking-wide">
                  <span className="w-2 h-2 bg-[#4a6b5d]"></span>
                  英文译文
                </h2>
              </div>
              <textarea
                ref={targetRef}
                value={state.translatedText}
                onChange={(e) =>
                  dispatch({ type: "SET_TRANSLATED_TEXT", payload: e.target.value })
                }
                placeholder="请输入英文译文..."
                rows={6}
                className="w-full p-5 border border-[#decfa6]/60 rounded-sm
                  bg-[#fdfcf7] focus:outline-none focus:border-[#c9c1ad]
                  text-[#3d3226] placeholder:text-[#b8b09c] transition-colors
                  shadow-[inset_1px_2px_6px_rgba(210,193,155,0.2)]"
                style={{ fontFamily: "SimSun, STSong, serif" }}
                spellCheck={false}
              />
            </div>

            {/* 规则应用摘要 */}
            {state.appliedRules.length > 0 && (
              <div className="mb-4 p-3 bg-[#f2f5f3] rounded-sm border border-[#d0d9d3] flex-shrink-0">
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

            {/* 操作按钮 */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
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
                  !state.sourceText.trim() ||
                  !state.translatedText.trim() ||
                  state.isReviewing
                }
                className="bg-[#c85a3e] hover:bg-[#b04b30] text-[#fbf9f3] font-serif font-bold tracking-widest px-6 py-2.5 rounded-[4px_8px_4px_6px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
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

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-[#fdf0ed] rounded-sm border border-[#e8c4bc] text-[#8c4a32] text-xs flex-shrink-0">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ========== 段落级 CAT 编辑区（审校完成后展示） ========== */}
            {reviewExecuted && (
              <>
                <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                  <div className="h-px flex-1 bg-[#e3ded0]" />
                  <span className="font-mono text-[10px] tracking-widest text-[#b8b09c] uppercase">
                    Segments · 段落编辑
                  </span>
                  <div className="h-px flex-1 bg-[#e3ded0]" />
                </div>

                {state.segments.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {state.segments.map((seg) => {
                      const hasSegAnnotations = seg.annotations.length > 0;
                      // 高亮当前选中的批注所在的 segment
                      const isHighlighted =
                        activeAnnotationId &&
                        seg.annotations.some((a) => a.id === activeAnnotationId);

                      return (
                        <div
                          key={seg.id}
                          className={`border rounded-sm bg-[#fdfcf7] shadow-[inset_1px_2px_6px_rgba(210,193,155,0.2)] overflow-hidden transition-colors ${
                            isHighlighted
                              ? "border-[#e6c412] ring-1 ring-[#e6c412]/30"
                              : "border-[#decfa6]/60"
                          }`}
                        >
                          {/* 原文（只读） */}
                          {seg.source && (
                            <div className="px-4 pt-3 pb-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-1.5 h-1.5 bg-[#5a4c3b] rounded-full"></span>
                                <span className="text-[10px] font-semibold text-[#7c6e5c] font-mono tracking-wide uppercase">
                                  Source
                                </span>
                              </div>
                              <p
                                className="text-sm text-[#3d3226] leading-relaxed whitespace-pre-wrap"
                                style={{ fontFamily: "SimSun, STSong, serif" }}
                              >
                                {seg.source}
                              </p>
                            </div>
                          )}

                          {/* 分隔线 */}
                          {seg.source && (
                            <div className="px-4">
                              <div className="h-px bg-[#e3ded0]" />
                            </div>
                          )}

                          {/* 译文（可编辑） */}
                          <div className="px-4 pt-3 pb-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="w-1.5 h-1.5 bg-[#4a6b5d] rounded-full"></span>
                              <span className="text-[10px] font-semibold text-[#4a6b5d] font-mono tracking-wide uppercase">
                                Translation
                              </span>
                              {hasSegAnnotations && (
                                <span className="text-[10px] text-[#8c7b6a] ml-auto font-mono">
                                  {seg.annotations.length} 条批注
                                </span>
                              )}
                            </div>
                            <textarea
                              value={seg.target}
                              onChange={(e) =>
                                handleSegmentTargetChange(seg.id, e.target.value)
                              }
                              rows={Math.max(2, Math.ceil(seg.target.length / 60))}
                              className="w-full p-3 border border-[#decfa6]/60 rounded-sm
                                bg-[#fdfcf7] focus:outline-none focus:border-[#c9c1ad]
                                text-[#3d3226] transition-colors font-mono text-sm
                                shadow-[inset_1px_2px_6px_rgba(210,193,155,0.2)] resize-y"
                              spellCheck={false}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[120px] text-center border border-dashed border-[#d8d2c2] rounded-sm bg-[#fdfcf7] shadow-[inset_1px_2px_6px_rgba(210,193,155,0.2)] flex-shrink-0">
                    <div className="w-10 h-10 bg-[#f4f1ea] rounded-full flex items-center justify-center mb-2 border border-[#e2dec9]">
                      <span className="text-lg">✅</span>
                    </div>
                    <p className="text-[#8c7b6a] text-sm">审校完成，未发现问题</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ===== 右侧区域 30%：审校批注面板 ===== */}
        <div className="w-[30%] flex flex-col min-h-0">
          <div className="flex-1 bg-[#fbf9f3] border border-[#e3ded0] rounded-[6px_12px_8px_10px] shadow-[3px_6px_20px_rgba(61,50,38,0.1)] flex flex-col p-4 overflow-y-auto min-h-0">
            {/* 面板标题 */}
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
              <span className="w-2 h-2 bg-[#db5d8f] rounded-full"></span>
              <h2 className="text-sm font-semibold text-[#3d3226] font-mono tracking-wide">
                审校批注
              </h2>
              {hasAnnotations && (
                <span className="ml-auto text-[10px] text-[#8c7b6a] font-mono bg-[#f4f1ea] px-2 py-0.5 rounded-sm">
                  {totalAnnotations} 条
                </span>
              )}
            </div>

            {!reviewExecuted ? (
              /* 未审校时的提示 */
              <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="w-10 h-10 bg-[#f4f1ea] rounded-full flex items-center justify-center mb-3 border border-[#e2dec9]">
                  <Lightbulb size={18} className="text-[#b8b09c]" />
                </div>
                <p className="text-xs text-[#b8b09c] leading-relaxed">
                  输入中英文后
                  <br />
                  点击"开始审校"
                  <br />
                  查看 AI 批注
                </p>
              </div>
            ) : hasAnnotations ? (
              /* 按分类展示批注 */
              <div className="flex flex-col gap-4">
                {categoryOrder.map((cat) => {
                  const items = groupedAnnotations[cat];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={cat}>
                      {/* 分类标题 */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-1 h-1 bg-[#7c6e5c] rounded-full"></span>
                        <span className="text-[10px] font-semibold text-[#7c6e5c] font-mono tracking-wide uppercase">
                          {categoryLabels[cat]}
                        </span>
                        <span className="text-[10px] text-[#b8b09c] font-mono ml-auto">
                          {items.length}
                        </span>
                      </div>

                      {/* 批注列表 */}
                      <div className="space-y-1.5">
                        {items.map((annotation) => {
                          const cfg = severityConfig[annotation.severity] || severityConfig.info;
                          const Icon = cfg.icon;
                          const isActive = activeAnnotationId === annotation.id;
                          const highlightedText = state.translatedText.slice(
                            annotation.start,
                            annotation.end
                          );

                          return (
                            <button
                              key={annotation.id}
                              onClick={() => handleAnnotationClick(annotation)}
                              className={`w-full text-left p-2.5 rounded-sm border text-xs transition-all ${
                                isActive
                                  ? "border-[#e6c412] bg-[#fefce8] shadow-sm"
                                  : `${cfg.bg} hover:shadow-sm`
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {Icon && (
                                  <Icon size={14} className={`${cfg.color} mt-0.5 shrink-0`} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`font-medium font-mono ${cfg.color}`}>
                                      {cfg.label}
                                    </span>
                                    {highlightedText && (
                                      <span className="text-[10px] text-[#b8b09c] font-mono truncate">
                                        「{highlightedText}」
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[#5a4c3b] leading-relaxed">
                                    {annotation.comment}
                                  </p>
                                  {annotation.suggestion && (
                                    <div className="mt-2 p-2 bg-[#faf8f5] rounded-sm border border-[#e2dec9]">
                                      <p className="text-[#8c7b6a] text-[10px] mb-0.5">
                                        修改建议：
                                      </p>
                                      <p className="text-[#5a4c3b] font-medium font-mono">
                                        {annotation.suggestion}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 审校完成但无批注 */
              <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="w-10 h-10 bg-[#f4f1ea] rounded-full flex items-center justify-center mb-3 border border-[#e2dec9]">
                  <CheckCircle2 size={18} className="text-[#8c7b6a]" />
                </div>
                <p className="text-xs text-[#8c7b6a]">未发现问题</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
