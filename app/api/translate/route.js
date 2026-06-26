/**
 * DeepSeek API 代理路由
 * POST /api/translate
 * 
 * 安全考虑：API Key 只在服务端使用，不暴露给前端
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(request) {
  try {
    const { sourceText, terms } = await request.json();

    if (!sourceText || !sourceText.trim()) {
      return Response.json(
        { error: "请输入中文原文" },
        { status: 400 }
      );
    }

    if (!DEEPSEEK_API_KEY) {
      return Response.json(
        { error: "未配置 DEEPSEEK_API_KEY 环境变量" },
        { status: 500 }
      );
    }

    // 构建术语提示
    let termHint = "";
    if (terms && terms.length > 0) {
      const termList = terms
        .map((t) => `- "${t.zh}" → "${t.en}"`)
        .join("\n");
      termHint = `\n\n请优先使用以下术语翻译：\n${termList}`;
    }

    const systemPrompt = `你是一名专业的高校外宣新闻翻译专家。请将以下中文新闻稿翻译为地道的英文。

翻译要求：
1. 使用正式、学术化的英文风格，适合大学官方网站发布
2. 保持原文的段落结构
3. 确保术语准确、统一
4. 避免中式英文表达
5. 使用自然流畅的英文句式
6. 输出纯英文译文，不要包含任何解释或注释${termHint}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: sourceText },
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
    const translatedText = data.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      return Response.json(
        { error: "DeepSeek 未返回翻译结果" },
        { status: 500 }
      );
    }

    return Response.json({ translatedText });
  } catch (error) {
    console.error("Translate API error:", error);
    return Response.json(
      { error: error.message || "翻译服务异常" },
      { status: 500 }
    );
  }
}
