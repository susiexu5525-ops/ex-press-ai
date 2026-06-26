/**
 * 审校批注 Tokenizer
 * 将译文按批注区间拆分为可渲染的 token 数组
 */

/**
 * @param {string} text 英文译文
 * @param {Array} annotations 批注列表 [{id, start, end, severity, comment, suggestion}]
 * @returns {Array<{type: 'text'|'annotation', content: string, annotation?: object}>}
 */
export function tokenizeWithAnnotations(text, annotations) {
  if (!annotations.length) return [{ type: "text", content: text }];

  // 按位置排序，处理重叠
  const sorted = [...annotations]
    .filter((a) => a.start >= 0 && a.end <= text.length && a.end > a.start)
    .sort((a, b) => a.start - b.start);

  if (!sorted.length) return [{ type: "text", content: text }];

  const segments = [];
  let cursor = 0;

  for (const ann of sorted) {
    if (ann.start > cursor) {
      segments.push({ type: "text", content: text.slice(cursor, ann.start) });
    }
    // 处理重叠：如果当前批注与前一个重叠，跳过重叠部分
    if (ann.start >= cursor) {
      segments.push({
        type: "annotation",
        content: text.slice(ann.start, ann.end),
        annotation: ann,
      });
      cursor = ann.end;
    }
  }
  if (cursor < text.length) {
    segments.push({ type: "text", content: text.slice(cursor) });
  }
  return segments;
}
