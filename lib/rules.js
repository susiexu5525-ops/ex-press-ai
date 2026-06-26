/**
 * 规则匹配引擎
 * 对英文译文应用导师/学校规范，返回替换结果
 */

import { getRules } from "./storage";

/**
 * @param {string} translatedText 英文译文
 * @returns {{ finalText: string, appliedRules: Array<{id: number, name: string, original: string, replaced: string, severity: string}> }}
 */
export function applyRules(translatedText) {
  if (!translatedText) return { finalText: translatedText, appliedRules: [] };

  const rules = getRules();
  if (rules.length === 0)
    return { finalText: translatedText, appliedRules: [] };

  let text = translatedText;
  const appliedRules = [];

  for (const rule of rules) {
    // 跳过没有 pattern 的纯提示型规则
    if (!rule.pattern) continue;

    const regex = new RegExp(rule.pattern, "gi");
    const matches = text.match(regex);

    if (matches) {
      text = text.replace(regex, rule.replacement);
      appliedRules.push({
        id: rule.id,
        name: rule.name,
        severity: rule.severity,
        original: matches[0],
        replaced: rule.replacement,
        matchCount: matches.length,
      });
    }
  }

  return { finalText: text, appliedRules };
}

/**
 * 获取所有规则（用于规则管理面板展示）
 */
export function getAllRules() {
  return getRules();
}
