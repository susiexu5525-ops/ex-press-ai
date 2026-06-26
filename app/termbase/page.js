"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function TermbasePage() {
  const router = useRouter();

  return (
    <div className="w-full space-y-6">
      <button
        onClick={() => router.push("/")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={16} />
        返回首页
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <BookOpen size={20} className="text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">术语库</h1>
          <p className="text-xs text-slate-400">管理高校外宣常用术语</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">术语管理</h2>
          <p className="text-slate-400 text-sm max-w-md">
            在首页点击"术语库"按钮可以打开术语管理器弹窗，添加和编辑高校外宣常用术语翻译。
          </p>
        </div>
      </div>
    </div>
  );
}
