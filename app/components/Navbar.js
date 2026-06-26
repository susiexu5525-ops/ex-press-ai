"use client";

import { useApp } from "@/app/layout";
import { Languages, PenLine, BookOpen, ShieldCheck } from "lucide-react";
import { getTerms, getRules } from "@/lib/storage";
import { useState, useEffect } from "react";

const tabs = [
  { id: "translate", label: "翻译", icon: Languages },
  { id: "review", label: "审校", icon: PenLine },
  { id: "terms", label: "术语库", icon: BookOpen },
  { id: "rules", label: "规则库", icon: ShieldCheck },
];

export default function Navbar() {
  const { state, dispatch } = useApp();
  const [termCount, setTermCount] = useState(0);
  const [ruleCount, setRuleCount] = useState(0);

  useEffect(() => {
    setTermCount(getTerms().length);
    setRuleCount(getRules().length);
  }, [state.showTermManager, state.showRuleManager]);

  const handleTabClick = (id) => {
    if (id === "terms") {
      dispatch({ type: "TOGGLE_TERM_MANAGER" });
    } else if (id === "rules") {
      dispatch({ type: "TOGGLE_RULE_MANAGER" });
    } else {
      dispatch({ type: "SET_ACTIVE_TAB", payload: id });
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 select-none">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-blue-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ex</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-800">
            <span className="text-brand-600">ex·press</span>
            <span className="text-slate-500 font-normal text-sm ml-1">
              AI
            </span>
          </h1>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.id === "terms"
                ? state.showTermManager
                : tab.id === "rules"
                ? state.showRuleManager
                : state.activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-brand-50 text-brand-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }
                `}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.id === "terms" && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-brand-100 text-brand-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {termCount}
                  </span>
                )}
                {tab.id === "rules" && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-brand-100 text-brand-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {ruleCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            高校外宣新闻翻译与审校
          </span>
        </div>
      </div>
    </header>
  );
}
