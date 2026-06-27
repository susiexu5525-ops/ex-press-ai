/**
 * AI 翻译与审校模块
 * 翻译：通过 DeepSeek API 代理路由
 * 审校：优先调用 DeepSeek AI 审校，失败时 fallback 到本地正则检查
 */

import { getTerms } from "./storage";
import { reviewWithDeepSeek } from "./deepseekReview";

/**
 * 模拟 AI 翻译（中文→英文）
 * 实际使用术语库做模板匹配 + 句法重组
 *
 * @param {string} sourceText 中文原文
 * @param {Array} detectedTerms 检测到的术语
 * @returns {Promise<string>} 英文译文
 */
export async function mockTranslate(sourceText, detectedTerms) {
  // 模拟延迟
  await new Promise((r) => setTimeout(r, 600));

  if (!sourceText.trim()) return "";

  // 1. 先替换术语
  let result = sourceText;
  // 按术语长度降序排列，优先替换长术语
  const sorted = [...detectedTerms].sort(
    (a, b) => b.zh.length - a.zh.length
  );
  for (const term of sorted) {
    result = result.replace(new RegExp(term.zh, "g"), term.en);
  }

  // 2. 基本句子结构转换
  // 分句处理
  const sentences = result.split(/(?<=[。！？；\n])/);
  const translatedSentences = sentences.map((s) => {
    let t = s.trim();
    if (!t) return "";

    // 简单的中→英结构映射（模拟）
    t = t
      .replace(/近年来，/g, "In recent years, ")
      .replace(/日前，/g, "Recently, ")
      .replace(/据悉，/g, "It is reported that ")
      .replace(/标志着/g, "marks")
      .replace(/取得了/g, "has achieved")
      .replace(/进一步/g, "further")
      .replace(/不断加强/g, "has been continuously strengthened")
      .replace(/深入推进/g, "has been deeply advanced")
      .replace(/着力/g, "focuses on")
      .replace(/致力于/g, "is committed to")
      .replace(/荣获/g, "has been awarded")
      .replace(/被评为/g, "has been recognized as")
      .replace(/位居/g, "ranks")
      .replace(/全国前列/g, "among the top in the nation")
      .replace(/显著提升/g, "has significantly improved");

    return t;
  });

  return translatedSentences.join(" ").trim();
}

/**
 * 本地正则审校（fallback）
 * 当 DeepSeek API 不可用时使用
 */
function localRegexReview(translatedText, appliedRules) {
  const annotations = [];
  let id = 0;

  const addAnnotation = (start, end, severity, comment, suggestion) => {
    if (start >= 0 && end > start && end <= translatedText.length) {
      annotations.push({
        id: `a${++id}`,
        start,
        end,
        severity,
        comment,
        suggestion,
      });
    }
  };

  // 1. 规则应用反馈
  for (const rule of appliedRules) {
    const idx = translatedText.indexOf(rule.replaced);
    if (idx !== -1 && rule.severity === "强制") {
      addAnnotation(
        idx,
        idx + rule.replaced.length,
        "info",
        `✅ 规则"${rule.name}"已自动应用`,
        `已替换为 "${rule.replaced}"`
      );
    }
  }

  // 2. 检查过长句子（分句数量 ≥ 5 触发）
  const sentences = translatedText.split(/[.!?。]/);
  for (const sentence of sentences) {
    const clauses = sentence.split(/[,，;；]/);
    if (clauses.length >= 5) {
      const idx = translatedText.indexOf(sentence.trim());
      if (idx === -1) continue;
      addAnnotation(
        idx,
        idx + sentence.trim().length,
        "warning",
        "⚠️ 句子过长（包含 " + clauses.length + " 个分句），建议拆分为2-3句",
        "请拆分为短句，提高可读性"
      );
    }
  }

  // 3. 检查被动语态过度使用
  const passives = translatedText.match(/has been \w+ed/gi);
  if (passives && passives.length > 2) {
    addAnnotation(
      0,
      50,
      "warning",
      "⚠️ 被动语态使用较多，建议适当使用主动语态",
      "可尝试改为主动语态以增强表达力"
    );
  }

  // 4. 检查中国式表达
  const cnStyle = translatedText.match(
    /comprehensively|actively|vigorously|thoroughly|deeply/gi
  );
  if (cnStyle && cnStyle.length > 1) {
    for (const word of cnStyle) {
      const idx = translatedText.indexOf(word);
      if (idx !== -1) {
        addAnnotation(
          idx,
          idx + word.length,
          "suggestion",
          `💡 "${word}" 是中式英文高频词，考虑更自然的表达`,
          "建议替换为更地道的表达方式"
        );
      }
    }
  }

  // 5. 检查冠词使用
  const missingArticle = translatedText.match(
    /\b(is|has been|plays|serves|ranks)\s+(?!a |an |the )/gi
  );
  if (missingArticle) {
    addAnnotation(
      0,
      60,
      "suggestion",
      "💡 可能缺少冠词 (a/an/the)，请检查",
      "英文中抽象名词前通常也需要冠词"
    );
  }

  return annotations;
}

/**
 * AI 审校
 * 优先使用 DeepSeek AI 进行语义级审校，失败时 fallback 到本地正则检查
 *
 * @param {string} translatedText 英文译文
 * @param {Array} appliedRules 已应用的规则
 * @returns {Promise<Array<{id: string, start: number, end: number, severity: string, comment: string, suggestion: string}>>}
 */
export async function mockReview(translatedText, appliedRules) {
  if (!translatedText.trim()) return [];

  try {
    // 优先使用 DeepSeek AI 审校
    const aiAnnotations = await reviewWithDeepSeek(translatedText, appliedRules);

    // 合并已应用规则的反馈
    const ruleAnnotations = [];
    let id = 0;
    for (const rule of appliedRules) {
      const idx = translatedText.indexOf(rule.replaced);
      if (idx !== -1 && rule.severity === "强制") {
        ruleAnnotations.push({
          id: `r${++id}`,
          start: idx,
          end: idx + rule.replaced.length,
          severity: "info",
          comment: `✅ 规则"${rule.name}"已自动应用`,
          suggestion: `已替换为 "${rule.replaced}"`,
        });
      }
    }

    return [...ruleAnnotations, ...aiAnnotations];
  } catch (error) {
    console.warn("DeepSeek AI 审校失败，使用本地正则检查:", error.message);
    // Fallback：使用本地正则检查
    return localRegexReview(translatedText, appliedRules);
  }
}
