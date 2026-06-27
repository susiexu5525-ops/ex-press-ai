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
 * 从参考语料中提取高频术语和表达模式
 * @param {string|null} corpusContent 参考语料文本
 * @returns {{ termFreq: Map, suggestions: string[] }}
 */
function analyzeReferenceCorpus(corpusContent) {
  if (!corpusContent) return { termFreq: new Map(), suggestions: [] };

  // 提取 3-gram 到 5-gram 的高频短语
  const words = corpusContent.split(/\s+/).filter((w) => w.length > 1);
  const phrases = new Map();

  for (let n = 3; n <= 5; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(" ");
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }
  }

  // 筛选出现次数 ≥ 2 的短语
  const termFreq = new Map();
  for (const [phrase, count] of phrases) {
    if (count >= 2) termFreq.set(phrase, count);
  }

  // 提取学术常用表达建议
  const suggestions = [];
  const academicPatterns = corpusContent.match(
    /\b(it is (widely|generally|commonly) \w+ that|has been (widely|extensively) \w+|plays? (a|an) \w+ role in|in terms of|with respect to|in the context of|as a result of|due to the fact that|in order to|it should be noted that)\b/gi
  );
  if (academicPatterns) {
    const unique = [...new Set(academicPatterns.map((s) => s.toLowerCase()))];
    suggestions.push(
      ...unique.slice(0, 10).map((s) => `参考语料中常见表达：${s}`)
    );
  }

  return { termFreq, suggestions };
}

/**
 * 本地正则审校（fallback）
 * 当 DeepSeek API 不可用时使用
 */
function localRegexReview(translatedText, appliedRules, referenceCorpus) {
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

  // 6. 参考语料分析（如果用户上传了参考语料）
  if (referenceCorpus?.content) {
    const { termFreq, suggestions } = analyzeReferenceCorpus(
      referenceCorpus.content
    );

    // 添加参考语料提示
    if (suggestions.length > 0) {
      addAnnotation(
        0,
        Math.min(100, translatedText.length),
        "info",
        `📚 已加载参考语料「${referenceCorpus.name}」，审校时将参考其学术表达风格`,
        suggestions.join("；")
      );
    }

    // 检查术语一致性：从参考语料中提取的高频术语
    const topTerms = [...termFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    for (const [phrase, freq] of topTerms) {
      // 检查译文中是否使用了该术语但写法不同
      const words = phrase.split(/\s+/);
      const keyWords = words.filter(
        (w) => w.length > 4 && !/^(the|and|that|with|from|have|been|this)$/i.test(w)
      );
      if (keyWords.length === 0) continue;

      // 如果译文中包含该关键词但未包含完整短语
      const hasKeyWord = keyWords.some((kw) =>
        translatedText.toLowerCase().includes(kw.toLowerCase())
      );
      const hasFullPhrase = translatedText
        .toLowerCase()
        .includes(phrase.toLowerCase());

      if (hasKeyWord && !hasFullPhrase) {
        const kwIdx = translatedText
          .toLowerCase()
          .indexOf(keyWords[0].toLowerCase());
        if (kwIdx !== -1) {
          addAnnotation(
            Math.max(0, kwIdx - 10),
            Math.min(translatedText.length, kwIdx + keyWords[0].length + 10),
            "suggestion",
            `💡 参考语料中更常用「${phrase}」（出现 ${freq} 次），建议参考此表达`,
            `参考语料中的表达：${phrase}`
          );
        }
      }
    }
  }

  return annotations;
}

/**
 * AI 审校
 * 优先使用 DeepSeek AI 进行语义级审校，失败时 fallback 到本地正则检查
 *
 * @param {string} translatedText 英文译文
 * @param {Array} appliedRules 已应用的规则
 * @param {{ name: string, content: string }|null} referenceCorpus 参考语料
 * @returns {Promise<Array<{id: string, start: number, end: number, severity: string, comment: string, suggestion: string}>>}
 */
export async function mockReview(translatedText, appliedRules, referenceCorpus) {
  if (!translatedText.trim()) return [];

  try {
    // 优先使用 DeepSeek AI 审校（传递参考语料）
    const aiAnnotations = await reviewWithDeepSeek(
      translatedText,
      appliedRules,
      referenceCorpus
    );

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
    return localRegexReview(translatedText, appliedRules, referenceCorpus);
  }
}
