
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const { title, source, published_at } = req.body || {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({
        success: false,
        error: "News title is required"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions: `
You are HAZZ ULTIMATE PRO AI NEWS INTELLIGENCE.

Analyze financial and economic news professionally.

Focus on:
- XAUUSD / Gold
- US Dollar (USD)
- Forex market
- Federal Reserve and interest rates
- Inflation and employment data

Return valid JSON only with these fields:
{
  "summary": "Short news summary",
  "sentiment": "BULLISH, BEARISH, or NEUTRAL",
  "gold_impact": "BULLISH, BEARISH, NEUTRAL, or UNCERTAIN",
  "usd_impact": "BULLISH, BEARISH, NEUTRAL, or UNCERTAIN",
  "impact_level": "LOW, MEDIUM, HIGH, or CRITICAL",
  "market_analysis": "Explain possible market effects",
  "risk_note": "Explain uncertainty and what traders should monitor"
}

Do not invent facts, prices, or economic results.
Do not treat a possible market reaction as guaranteed.
If information is insufficient, use UNCERTAIN.
This is analysis, not a trading instruction.
          `,
          input: JSON.stringify({
            title: title.slice(0, 1000),
            source: String(source || "Unknown").slice(0, 200),
            published_at: String(published_at || "").slice(0, 100)
          }),
          text: {
            format: {
              type: "json_object"
            }
          },
          max_output_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "OpenAI API request failed"
      );
    }

    const outputText = (data.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("");

    if (!outputText) {
      throw new Error("AI returned an empty response");
    }

    const analysis = JSON.parse(outputText);

    return res.status(200).json({
      success: true,
      source: "OpenAI AI Analysis",
      analysis
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

