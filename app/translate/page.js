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
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col p-6 bg-[#EFECE4] select-none box-border z-0">

      {/* 全局复古多重碎纸拼贴背景 — 与主页完全一致 */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10rem] left-[10%] w-[45vw] h-[25rem] bg-[#db5d8f] rounded-[30%_70%_40%_60%/_50%_30%_70%_50%] opacity-90" />
        <div className="absolute top-[-5rem] left-[-10rem] w-[35vw] h-[35rem] bg-[#d94e1d] rounded-[40%_60%_30%_70%/_60%_40%_70%_30%] opacity-95" />
        <div className="absolute top-[-8rem] right-[-10rem] w-[50vw] h-[45rem] bg-[#2496c7] rounded-[50%_50%_30%_70%/_40%_60%_40%_60%] opacity-90" />
        <div className="absolute bottom-[-12rem] left-[-5rem] w-[45vw] h-[45rem] bg-[#e6c412] rounded-[70%_30%_60%_40%/_50%_50%_60%_40%] opacity-95" />
        <div className="absolute bottom-[-10rem] right-[-8rem] w-[50vw] h-[45rem] bg-[#008f85] rounded-[40%_60%_50%_50%/_60%_40%_60%_40%] opacity-90" />
      </div>

      {/* 左上角 Header 区域 ── 高对比度复古排版修复版 */}
      <div className="flex flex-col gap-3 flex-shrink-0 mb-4 select-none">
        
        {/* 1. 返回桌面按钮 ── 火漆白字标签 */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#fbf9f3] bg-[#2c241c]/60 hover:bg-[#2c241c]/90 px-2.5 py-1 rounded-sm w-fit shadow-sm backdrop-blur-sm border border-white/10 transition-all active:scale-95"
        >
          <span>←</span> BACK TO DESK
        </button>

        {/* 2. 标题组合区 ── 象牙白便签底衬，破开深色背景 */}
        <div className="bg-[#fbf9f3]/90 border border-[#decfa6]/50 shadow-md p-3 py-2.5 rounded-[4px_10px_3px_6px] max-w-xs flex items-center gap-3 relative overflow-hidden backdrop-blur-sm">
          {/* 侧边装饰红条 ── 模拟老式记事本 */}
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#c85a3e]" />
          
          {/* 图标区 */}
          <div className="w-10 h-10 bg-[#2c241c] rounded-md flex items-center justify-center text-[#decfa6] flex-shrink-0 shadow-inner">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>

          {/* 文字区 */}
          <div className="flex flex-col">
            <h1 className="font-serif font-black text-[#2c241c] text-xl tracking-wider flex items-center gap-1">
              AI 翻译 <span className="font-sans text-xs text-[#8c7e6c] italic font-light lowercase">translate</span>
            </h1>
            <p className="font-mono text-[10px] tracking-widest text-[#7c6e5c] uppercase mt-0.5">
              新闻初稿投递台
            </p>
          </div>
        </div>

      </div>

      {/* 中央工作区 — 百年陈旧老稿纸容器 */}
      <div className="h-[75vh] bg-[#fbf9f3] border border-[#e3ded0] rounded-[6px_12px_8px_10px] shadow-[3px_6px_20px_rgba(61,50,38,0.1)] flex flex-col p-6 overflow-y-auto flex-shrink-0">

        {/* 输入区域 */}
        <div className="mb-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
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
            className="w-full p-5 border border-[#decfa6]/60 rounded-sm
              bg-[#fdfcf7] focus:outline-none focus:border-[#c9c1ad]
              text-[#3d3226] placeholder:text-[#b8b09c] transition-colors
              shadow-[inset_1px_2px_6px_rgba(210,193,155,0.2)]"
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
            className="bg-[#c85a3e] hover:bg-[#b04b30] text-[#fbf9f3] font-serif font-bold tracking-widest px-6 py-2.5 rounded-[4px_8px_4px_6px] shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
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

        {/* 分隔线 */}
        <div className="flex items-center gap-3 my-5 flex-shrink-0">
          <div className="h-px flex-1 bg-[#e3ded0]" />
          <span className="font-mono text-[10px] tracking-widest text-[#b8b09c] uppercase">译文输出</span>
          <div className="h-px flex-1 bg-[#e3ded0]" />
        </div>

        {/* 译文输出区 */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
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
              className="w-full min-h-[160px] p-5 border border-[#decfa6]/60 rounded-sm
                bg-[#fdfcf7] overflow-auto leading-relaxed text-[16px] text-[#3d3226]
                shadow-[inset_1px_2px_6px_rgba(210,193,155,0.2)]"
              style={{ fontFamily: "SimSun, STSong, serif" }}
            >
              {state.translatedText}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[160px] text-center border border-dashed border-[#d8d2c2] rounded-sm bg-[#fdfcf7] shadow-[inset_1px_2px_6px_rgba(210,193,155,0.2)]">
              {state.isTranslating ? (
                <div className="flex items-center gap-2 text-[#8c7b6a]">
                  <RotateCw size={18} className="animate-spin" />
                  <span className="text-sm font-mono">翻译中...</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-[#f4f1ea] rounded-full flex items-center justify-center mb-3 border border-[#e2dec9]">
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
    </div>
  );
}
