/**
 * DeepSeek API 翻译调用
 * 通过 Next.js API 路由代理，API Key 仅存在于服务端
 *
 * @param {string} sourceText 中文原文
 * @param {Array} detectedTerms 检测到的术语列表
 * @returns {Promise<string>} 英文译文
 */
export async function translateWithDeepSeek(sourceText, detectedTerms) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceText,
      terms: detectedTerms,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `请求失败 (${response.status})`);
  }

  if (!data.translatedText) {
    throw new Error("DeepSeek 未返回翻译结果");
  }

  return data.translatedText;
}
