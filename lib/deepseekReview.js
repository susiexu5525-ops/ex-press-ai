/**
 * DeepSeek API 审校调用
 * 通过 Next.js API 路由代理，API Key 仅存在于服务端
 *
 * @param {string} translatedText 英文译文
 * @param {Array} appliedRules 已应用的规则列表
 * @returns {Promise<Array<{id: string, start: number, end: number, severity: string, comment: string, suggestion: string}>>}
 */
export async function reviewWithDeepSeek(translatedText, appliedRules = []) {
  const response = await fetch("/api/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      translatedText,
      appliedRules,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `审校请求失败 (${response.status})`);
  }

  if (!data.annotations) {
    throw new Error("DeepSeek 未返回审校结果");
  }

  return data.annotations;
}
