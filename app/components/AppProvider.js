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
};

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
      <Navbar />
      <main className="flex flex-col items-center px-4 py-8">
        <div className="page-centered">{children}</div>
      </main>
      {state.showTermManager && <TerminologyManager />}
      {state.showRuleManager && <RuleManager />}
    </AppContext.Provider>
  );
}
