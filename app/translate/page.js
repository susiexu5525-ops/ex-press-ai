"use client";

import { useApp } from "@/app/components/AppProvider";
import { detectTerms, tokenizeWithTerms } from "@/lib/terminology";
import { translateWithDeepSeek } from "@/lib/deepseek";
import { applyRules } from "@/lib/rules";
import { mockReview } from "@/lib/mockAI";
import { addHistory } from "@/lib/storage";
import {
  Send,
  RotateCw,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Upload,
  FileText,
  ArrowLeft,
  X,
} from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const SAMPLE_TEXT = `近年来，我校在国际化办学和人才培养方面取得了显著成效。作为双一流建设高校，学校深入推进产学研合作，着力培养高素质人才。日前，学校荣获国家级教学成果奖，标志着我校高质量教育迈上新台阶。`;

export default function TranslatePage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

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
    setUploadedFile(null);
    setError("");
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

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 仅支持 .txt
    if (!file.name.endsWith(".txt")) {
      setError("目前仅支持 .txt 文件上传");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        dispatch({ type: "SET_SOURCE_TEXT", payload: content });
        setUploadedFile({ name: file.name, size: file.size });
      }
    };
    reader.onerror = () => {
      setError("文件读取失败，请重试");
    };
    reader.readAsText(file, "UTF-8");
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 术语高亮渲染
  const tokens = tokenizeWithTerms(state.sourceText, state.detectedTerms);

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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
          <Send size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">AI 翻译</h1>
          <p className="text-xs text-slate-400">中文新闻稿 → 英文译文</p>
        </div>
      </div>

      {/* 输入区域 — 横向长方形，单列居中 */}
      <div className="bg-[#faf8f5] rounded-sm border border-[#e2dec9] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#3d3226] flex items-center gap-2 font-mono tracking-wide">
            <span className="w-2 h-2 bg-[#5a4c3b]"></span>
            中文原文
          </h2>
          <button
            onClick={handleFillSample}
            className="text-xs text-[#8c7b6a] hover:text-[#5a4c3b] underline underline-offset-2"
          >
            填入示例
          </button>
        </div>

        <textarea
          value={state.sourceText}
          onChange={(e) =>
            dispatch({ type: "SET_SOURCE_TEXT", payload: e.target.value })
          }
          placeholder="请输入中文新闻稿内容..."
          rows={10}
          className="w-full p-5 border border-[#e2dec9] rounded-sm
            bg-[#f4f1ea] focus:outline-none focus:border-[#c9c1ad]
            text-[#3d3226] placeholder:text-[#b8b09c] transition-colors"
          style={{ fontFamily: "SimSun, STSong, serif" }}
          spellCheck={false}
        />

        {/* 文件上传 */}
        <div className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#5a4c3b]
              bg-[#f4f1ea] border border-[#e2dec9] rounded-sm cursor-pointer
              hover:bg-[#e6dfd3] hover:border-[#c9c1ad] transition-colors"
          >
            <Upload size={14} />
            上传文件参考 (.txt)
          </label>

          {uploadedFile && (
            <div className="mt-2 flex items-center gap-2 text-xs bg-[#f4f1ea] text-[#3d3226] px-3 py-1.5 rounded-sm border border-[#e2dec9]">
              <FileText size={14} />
              <span className="font-medium font-mono">{uploadedFile.name}</span>
              <span className="text-[#8c7b6a]">
                ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </span>
              <button
                onClick={removeFile}
                className="ml-1 text-[#8c7b6a] hover:text-[#5a4c3b]"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* 术语检测标签 */}
        {state.detectedTerms.length > 0 && (
          <div className="mt-3 p-3 bg-[#fdf9e7] rounded-sm border border-[#e8dba0]">
            <div className="text-xs font-medium text-[#5a4c3b] mb-2 font-mono">
              检测到 {state.detectedTerms.length} 个术语
            </div>
            <div className="flex flex-wrap gap-1.5">
              {state.detectedTerms.map((term) => (
                <span
                  key={`${term.id}-${term.start}`}
                  className="inline-flex items-center gap-1 text-xs bg-[#faf8f5] text-[#3d3226] px-2 py-0.5 rounded-sm border border-[#e2dec9]"
                  title={`${term.zh} → ${term.en}`}
                >
                  <span className="text-[#8c7b6a]">◆</span>
                  {term.zh}
                  <span className="text-[#8c7b6a]">→</span>
                  <span className="text-[#5a4c3b] font-medium font-mono">{term.en}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-[#fdf0ed] rounded-sm border border-[#e8c4bc] text-[#8c4a32] text-xs">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8c7b6a] hover:text-[#5a4c3b] hover:bg-[#f4f1ea] rounded-sm transition-colors"
            disabled={!state.sourceText}
          >
            <Trash2 size={14} />
            清空
          </button>

          <button
            onClick={handleTranslate}
            disabled={!state.sourceText.trim() || state.isTranslating}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#5a4c3b] text-[#f4f1ea] text-sm font-medium font-mono
              rounded-sm hover:bg-[#3d3226] disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors shadow-sm active:translate-y-px"
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

      {/* 译文输出 — 横向长方形，单列居中 */}
      <div className="bg-[#f4f1ea] rounded-sm border border-[#e2dec9] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#3d3226] flex items-center gap-2 font-mono tracking-wide">
            <span className="w-2 h-2 bg-[#4a6b5d]"></span>
            英文译文
          </h2>
          {state.translatedText && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8c7b6a] hover:text-[#5a4c3b] hover:bg-[#e6dfd3] rounded-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-[#4a6b5d]" />
                  已复制
                </>
              ) : (
                <>
                  <Copy size={14} />
                  复制译文
                </>
              )}
            </button>
          )}
        </div>

        {state.translatedText ? (
          <div
            className="w-full min-h-[200px] p-5 border border-[#e2dec9] rounded-sm
              bg-[#faf8f5] overflow-auto leading-relaxed text-[16px] text-[#3d3226] font-mono"
          >
            {state.translatedText}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center border border-dashed border-[#d8d2c2] rounded-sm bg-[#faf8f5]">
            {state.isTranslating ? (
              <div className="flex items-center gap-2 text-[#8c7b6a]">
                <RotateCw size={18} className="animate-spin" />
                <span className="text-sm font-mono">翻译中...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-[#f4f1ea] rounded-sm flex items-center justify-center mb-3 border border-[#e2dec9]">
                  <span className="text-xl">🌐</span>
                </div>
                <p className="text-[#8c7b6a] text-sm">译文将在此显示</p>
                <p className="text-[#b8b09c] text-xs mt-1" style={{ fontFamily: "SimSun, STSong, serif" }}>
                  输入中文后点击「AI 翻译」
                </p>
              </>
            )}
          </div>
        )}

        {/* 规则应用摘要 */}
        {state.appliedRules.length > 0 && (
          <div className="mt-4 p-3 bg-[#f2f5f3] rounded-sm border border-[#d0d9d3]">
            <div className="text-xs font-medium text-[#3d5a4a] mb-2 font-mono">
              规则自动应用 ({state.appliedRules.length} 条)
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

        {/* 审校批注摘要 */}
        {state.annotations.length > 0 && (
          <div className="mt-4 p-3 bg-[#fdf5f3] rounded-sm border border-[#e8d0ca]">
            <div className="text-xs font-medium text-[#8c4a32] mb-1 font-mono">
              审校批注 ({state.annotations.length} 条)
            </div>
            <p className="text-xs text-[#8c7b6a]" style={{ fontFamily: "SimSun, STSong, serif" }}>
              请前往
              <button
                onClick={() => router.push("/review")}
                className="text-[#5a4c3b] underline mx-1 font-medium"
              >
                审校页面
              </button>
              查看详细批注
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
