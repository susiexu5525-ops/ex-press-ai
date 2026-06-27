"use client";

import { useReducer, useEffect, createContext, useContext } from "react";
import Navbar from "./Navbar";
import TerminologyManager from "./TerminologyManager";
import RuleManager from "./RuleManager";
import { initDefaults } from "@/lib/storage";

// --- Context ---
export const AppContext = createContext(null);

const initialState = {
  // 翻译
  sourceText: "",
  translatedText: "",
  isTranslating: false,
  isReviewing: false,

  // 术语
  detectedTerms: [],
  showTermManager: false,

  // 规则
  appliedRules: [],
  showRuleManager: false,

  // 审校
  annotations: [],
  activeAnnotation: null,

  // UI
  activeTab: "translate",

  // 段落级CAT segments（AppProvider 一次性生成，页面只做渲染）
  // 结构: [{ id, source, target, annotations: [...] }]
  segments: [],

  // 参考语料（用户上传的英文论文/学术文章，用于辅助AI审校）
  // 结构: { name: string, content: string }
  referenceCorpus: null,
};

/**
 * 将文本按句子边界切分为 segment 数组
 * 仅在 AppProvider 中调用，页面层不得调用
 */
function splitTextToSegments(sourceText, translatedText, annotations) {
  if (!translatedText.trim()) return [];

  const sourceParts = splitBySentence(sourceText);
  const targetParts = splitBySentence(translatedText);
  const maxLen = Math.max(sourceParts.length, targetParts.length);

  const segments = [];
  for (let i = 0; i < maxLen; i++) {
    const src = sourceParts[i] || null;
    const trg = targetParts[i] || null;
    const segStart = trg ? trg.start : 0;
    const segEnd = trg ? trg.end : 0;

    // 绑定属于此 segment 字符区间的 annotations
    const segAnnotations = trg
      ? annotations.filter((a) => a.start >= segStart && a.end <= segEnd)
      : [];

    segments.push({
      id: `seg-${i}`,
      source: src ? src.text : "",
      target: trg ? trg.text : "",
      annotations: segAnnotations,
    });
  }
  return segments;
}

/** 按句子边界切分文本，返回 [{text, start, end}] */
function splitBySentence(text) {
  if (!text) return [];
  const parts = [];
  let lastIndex = 0;
  const regex = /[.!?。！？]\s*/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const end = match.index + match[0].length;
    parts.push({
      text: text.slice(lastIndex, end).trim(),
      start: lastIndex,
      end: end,
    });
    lastIndex = end;
  }
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex).trim(),
      start: lastIndex,
      end: text.length,
    });
  }
  return parts;
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_SOURCE_TEXT":
      return { ...state, sourceText: action.payload };
    case "SET_TRANSLATED_TEXT":
      return { ...state, translatedText: action.payload };
    case "SET_IS_TRANSLATING":
      return { ...state, isTranslating: action.payload };
    case "SET_IS_REVIEWING":
      return { ...state, isReviewing: action.payload };
    case "SET_DETECTED_TERMS":
      return { ...state, detectedTerms: action.payload };
    case "SET_APPLIED_RULES":
      return { ...state, appliedRules: action.payload };
    case "SET_ANNOTATIONS":
      return { ...state, annotations: action.payload };
    case "SET_ACTIVE_ANNOTATION":
      return { ...state, activeAnnotation: action.payload };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "TOGGLE_TERM_MANAGER":
      return { ...state, showTermManager: !state.showTermManager };
    case "TOGGLE_RULE_MANAGER":
      return { ...state, showRuleManager: !state.showRuleManager };
    // 一次性设置 segments（翻译/审校完成后调用）
    case "SET_SEGMENTS":
      return {
        ...state,
        segments: splitTextToSegments(
          state.sourceText,
          state.translatedText,
          state.annotations
        ),
      };
    // 修改单个 segment 的 target 文本
    case "UPDATE_SEGMENT_TARGET": {
      const { segmentId, newTarget } = action.payload;
      return {
        ...state,
        segments: state.segments.map((seg) =>
          seg.id === segmentId ? { ...seg, target: newTarget } : seg
        ),
      };
    }
    case "SET_REFERENCE_CORPUS":
      return { ...state, referenceCorpus: action.payload };
    case "CLEAR_REFERENCE_CORPUS":
      return { ...state, referenceCorpus: null };
    case "RESET":
      return {
        ...initialState,
        showTermManager: state.showTermManager,
        showRuleManager: state.showRuleManager,
      };
    default:
      return state;
  }
}

export function useApp() {
  return useContext(AppContext);
}

export default function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    initDefaults();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {/* Navbar 已隐藏 —— 主页使用独立的 fixed 一屏锁死布局 */}
      <main className="flex flex-col items-center">
        {children}
      </main>
      {state.showTermManager && <TerminologyManager />}
      {state.showRuleManager && <RuleManager />}
    </AppContext.Provider>
  );
}
