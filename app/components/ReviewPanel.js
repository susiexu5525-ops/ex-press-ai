"use client";

import { useApp } from "@/app/layout";
import { tokenizeWithAnnotations } from "@/lib/annotations";
import {
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

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

export default function ReviewPanel() {
  const { state, dispatch } = useApp();
  const [expandedAnnotations, setExpandedAnnotations] = useState({});

  const toggleAnnotation = (id) => {
    setExpandedAnnotations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!state.translatedText && !state.isTranslating && !state.isReviewing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-2xl">📝</span>
        </div>
        <p className="text-slate-400 text-sm mb-1">译文将在此显示</p>
        <p className="text-slate-300 text-xs">
          输入中文并点击「AI 翻译」开始
        </p>
      </div>
    );
  }

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
    <div className="flex flex-col h-full">
      {/* 面板头部 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          译文审校
        </h2>
        <div className="flex items-center gap-2">
          {state.isReviewing && (
            <span className="text-xs text-amber-500 animate-pulse">
              审校中...
            </span>
          )}
          {state.annotations.length > 0 && (
            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
              {state.annotations.length} 条批注
            </span>
          )}
        </div>
      </div>

      {/* 规则应用摘要 */}
      {state.appliedRules.length > 0 && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 mb-2">
            <CheckCircle2 size={14} />
            规则自动应用 ({state.appliedRules.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {state.appliedRules.map((rule) => (
              <span
                key={rule.id}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md
                  bg-green-100 text-green-700 border border-green-200"
              >
                {rule.name}
                <span className="text-green-400">|</span>
                <span className="line-through text-green-400 text-[10px]">
                  {rule.original}
                </span>
                <span>→</span>
                <span className="font-medium">{rule.replaced}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 译文展示区 */}
      <div className="flex-1 min-h-0 relative">
        <div
          className="w-full h-full min-h-[300px] p-4 border border-slate-200 rounded-xl
            bg-white overflow-auto leading-relaxed text-[15px] text-slate-700"
        >
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
                    absolute bottom-full left-0 mb-2 w-72 p-3 rounded-xl shadow-xl border z-50
                    ${cfg.bg || "bg-white border-slate-200"}
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
                      <div
                        className={`text-xs font-semibold mb-1 ${cfg.color}`}
                      >
                        {cfg.label}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed mb-2">
                        {annotation.comment}
                      </p>
                      {annotation.suggestion && (
                        <div className="p-2 bg-white/70 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 mb-0.5">
                            建议：
                          </p>
                          <p className="text-xs text-brand-700 font-medium">
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

          {/* 加载动画 */}
          {state.isTranslating && (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-brand-400 rounded-full pulse-dot"></span>
                <span
                  className="w-2 h-2 bg-brand-400 rounded-full pulse-dot"
                  style={{ animationDelay: "0.2s" }}
                ></span>
                <span
                  className="w-2 h-2 bg-brand-400 rounded-full pulse-dot"
                  style={{ animationDelay: "0.4s" }}
                ></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 审校批注列表 */}
      {state.annotations.length > 0 && (
        <div className="mt-3 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-semibold text-slate-600">
              审校批注列表
            </h3>
            <div className="flex items-center gap-1.5">
              {stats.error > 0 && (
                <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                  错误 {stats.error}
                </span>
              )}
              {stats.warning > 0 && (
                <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                  警告 {stats.warning}
                </span>
              )}
              {stats.info > 0 && (
                <span className="text-[10px] text-green-500 bg-green-50 px-1.5 py-0.5 rounded">
                  规则 {stats.info}
                </span>
              )}
              {stats.suggestion > 0 && (
                <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                  建议 {stats.suggestion}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {state.annotations.map((annotation) => {
              const cfg = severityConfig[annotation.severity] || {};
              const Icon = cfg.icon;
              const isExpanded = expandedAnnotations[annotation.id];

              return (
                <div
                  key={annotation.id}
                  className={`p-2.5 rounded-lg border text-xs ${cfg.bg} cursor-pointer transition-all hover:shadow-sm`}
                  onClick={() => toggleAnnotation(annotation.id)}
                >
                  <div className="flex items-start gap-2">
                    {Icon && (
                      <Icon size={14} className={`${cfg.color} mt-0.5`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`text-slate-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        {annotation.comment}
                      </p>
                      {isExpanded && annotation.suggestion && (
                        <div className="mt-2 p-2 bg-white/70 rounded border border-slate-100">
                          <p className="text-slate-500 mb-0.5">修改建议：</p>
                          <p className="text-brand-700 font-medium">
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
      )}
    </div>
  );
}
