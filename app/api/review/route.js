/**
 * DeepSeek API 审校代理路由
 * POST /api/review
 *
 * 安全考虑：API Key 只在服务端使用，不暴露给前端
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const REVIEW_SYSTEM_PROMPT = `你是一名专业的高校外宣英文审校专家。请对以下英文译文进行全面审校。

审校标准：

1. 术语一致性 (Terminology consistency)
确保同一术语在全文中的翻译保持一致。外宣材料中的专有名词（如校名、院系名、职称、项目名）必须统一。

2. 语法准确性 (Grammar accuracy)
检查语法错误，包括时态、主谓一致、冠词、句子结构等。全篇统一使用现在时或过去时，不得混用。

3. 忠实于原文 (Faithfulness to source meaning)
确保翻译准确反映中文原文的含义，不得引入事实错误或曲解原意。
允许改写、润色、重组句子以提高可读性。
允许删除冗余表达或合并/拆分句子以提高流畅度。
但不得：引入事实错误、删除重要信息、扭曲原意。

4. 表达自然度 (Naturalness of expression)
检查英文是否自然、流畅，避免过度直译或中式英文表达。
使用正式、学术化的英文风格，适合大学官方网站发布。
减少第一人称 (We)，增强客观性。
使用更精确的语言，避免模糊词（如 many, a lot of）。

5. 句子结构 (Sentence structure)
检查是否存在过长的句子，建议拆分为短句以提高可读性。

审校原则：
- 这不是逐字翻译检查，而是在忠实度和可读性之间取得平衡的语义级审校
- 允许改写、润色、重组句子
- 允许删除冗余或合并/拆分句子
- 禁止引入事实错误、删除重要信息或扭曲原意

输出格式：
请以 JSON 数组格式返回所有发现的问题，每条问题包含以下字段：
- start: 问题起始位置（整数，在译文中的字符索引）
- end: 问题结束位置（整数）
- severity: 严重程度，取值为 "warning"（警告）、"suggestion"（建议）或 "info"（信息）
- comment: 问题描述（中文）
- suggestion: 修改建议（中文）

如果没有发现任何问题，返回空数组 []。

重要：仅输出 JSON 数组，不要包含任何解释、markdown 标记或其他文字。`;

export async function POST(request) {
  try {
    const { translatedText, appliedRules } = await request.json();

    if (!translatedText || !translatedText.trim()) {
      return Response.json(
        { error: "请输入待审校的英文译文" },
        { status: 400 }
      );
    }

    if (!DEEPSEEK_API_KEY) {
      return Response.json(
        { error: "未配置 DEEPSEEK_API_KEY 环境变量" },
        { status: 500 }
      );
    }

    // 构建已应用规则提示
    let ruleHint = "";
    if (appliedRules && appliedRules.length > 0) {
      const ruleList = appliedRules
        .map((r) => `- ${r.name}：已自动将 "${r.pattern || r.replaced}" 替换为 "${r.replaced}"（${r.note || ""}）`)
        .join("\n");
      ruleHint = `\n\n以下规则已在翻译时自动应用，请确认这些替换是否恰当：\n${ruleList}`;
    }

    const userMessage = `请审校以下英文译文：\n\n${translatedText}${ruleHint}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: REVIEW_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("DeepSeek API error:", response.status, errData);
      return Response.json(
        {
          error:
            errData.error?.message ||
            `DeepSeek API 返回错误 (${response.status})`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      return Response.json(
        { error: "DeepSeek 未返回审校结果" },
        { status: 500 }
      );
    }

    // 解析 AI 返回的 JSON 数组
    let annotations = [];
    try {
      // 尝试直接解析
      annotations = JSON.parse(rawContent);
    } catch {
      // 如果 AI 返回了带 markdown 包裹的 JSON，尝试提取
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          annotations = JSON.parse(jsonMatch[0]);
        } catch {
          console.error("Failed to parse review JSON:", rawContent);
          return Response.json(
            { error: "审校结果解析失败" },
            { status: 500 }
          );
        }
      } else {
        console.error("No JSON array found in review response:", rawContent);
        return Response.json(
          { error: "审校结果格式异常" },
          { status: 500 }
        );
      }
    }

    // 为每条批注添加唯一 ID
    const result = annotations.map((a, i) => ({
      id: `r${i + 1}`,
      start: a.start,
      end: a.end,
      severity: a.severity || "suggestion",
      comment: a.comment || "",
      suggestion: a.suggestion || "",
    }));

    return Response.json({ annotations: result });
  } catch (error) {
    console.error("Review API error:", error);
    return Response.json(
      { error: error.message || "审校服务异常" },
      { status: 500 }
    );
  }
}
