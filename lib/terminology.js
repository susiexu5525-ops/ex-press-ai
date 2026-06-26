/**
 * 术语匹配与高亮
 * 在中文原文中找出所有匹配的术语
 */

import { getTerms } from "./storage";

/**
 * @param {string} sourceText 中文原文
 * @returns {Array<{id: string, zh: string, en: string, start: number, end: number}>}
 */
export function detectTerms(sourceText) {
  if (!sourceText) return [];
  const terms = getTerms();
  if (terms.length === 0) return [];

  const results = [];
  for (const term of terms) {
    let idx = 0;
    while (idx < sourceText.length) {
      const pos = sourceText.indexOf(term.zh, idx);
      if (pos === -1) break;
      // 避免重复匹配同一位置（针对短术语）
      const overlap = results.some(
        (r) =>
          (pos >= r.start && pos < r.end) ||
          (pos + term.zh.length > r.start && pos + term.zh.length <= r.end)
      );
      if (!overlap) {
        results.push({
          id: term.id,
          zh: term.zh,
          en: term.en,
          start: pos,
          end: pos + term.zh.length,
        });
      }
      idx = pos + 1;
    }
  }
  // 按位置排序
  results.sort((a, b) => a.start - b.start);
  return results;
}

/**
 * 对中文文本进行术语高亮渲染
 * @param {string} text
 * @param {Array} detectedTerms
 * @returns {Array<{type: 'text'|'term', content: string, termData?: object}>}
 */
export function tokenizeWithTerms(text, detectedTerms) {
  if (!detectedTerms.length) return [{ type: "text", content: text }];

  const segments = [];
  let cursor = 0;

  for (const term of detectedTerms) {
    if (term.start > cursor) {
      segments.push({ type: "text", content: text.slice(cursor, term.start) });
    }
    segments.push({
      type: "term",
      content: text.slice(term.start, term.end),
      termData: term,
    });
    cursor = term.end;
  }
  if (cursor < text.length) {
    segments.push({ type: "text", content: text.slice(cursor) });
  }
  return segments;
}
