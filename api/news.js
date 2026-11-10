function decodeXML(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getTag(xml, tag) {
  const match = xml.match(
    new RegExp(
      `<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`,
      "i"
    )
  );

  return match
    ? decodeXML(match[1].trim())
    : "";
}

export default async function handler(req, res) {
  try {
    const query =
  '("XAUUSD" OR "gold price" OR bullion OR forex OR "US dollar" OR "Federal Reserve" OR FOMC OR "US inflation" OR "Nonfarm Payrolls" OR "interest rates")';

    const url = new URL(
      "https://news.google.com/rss/search"
    );

    url.searchParams.set("q", query);
    url.searchParams.set("hl", "en-US");
    url.searchParams.set("gl", "US");
    url.searchParams.set("ceid", "US:en");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "HAZZ-ULTIMATE-PRO/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`News source error: ${response.status}`);
    }

    const xml = await response.text();

    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

    function analyzeSentiment(title) {
  const text = title.toLowerCase();

  const bullishWords = [
    "rally", "surge", "gain", "rise", "rising",
    "strong", "growth", "rebound", "optimism",
    "rate cut", "easing", "dovish"
  ];

  const bearishWords = [
    "crash", "fall", "drop", "decline", "weak",
    "selloff", "recession", "crisis", "hawkish",
    "rate hike", "surge in inflation"
  ];

  const bullish = bullishWords.filter(word => text.includes(word)).length;
  const bearish = bearishWords.filter(word => text.includes(word)).length;

  if (bullish > bearish) return "BULLISH";
  if (bearish > bullish) return "BEARISH";
  return "NEUTRAL";
}

function analyzeImpact(title) {
  const text = title.toLowerCase();

  if (/fomc|interest rate decision|fed decision|nonfarm payrolls|nfp|cpi|inflation report/.test(text)) {
    return "CRITICAL";
  }

  if (/federal reserve|inflation|jobs report|unemployment|pce|gdp|central bank/.test(text)) {
    return "HIGH";
  }

  if (/gold|xauusd|dollar|forex|treasury yield/.test(text)) {
    return "MEDIUM";
  }

  return "LOW";
}

const now = Date.now();
const MAX_AGE = 24 * 60 * 60 * 1000;

const articles = items.map(item => {
  const title = getTag(item, "title");
  const publishedAt = getTag(item, "pubDate");
  const publishedTime = new Date(publishedAt).getTime();

  return {
    title,
    source: getTag(item, "source") || "Google News",
    url: getTag(item, "link"),
    published_at: publishedAt,
    sentiment: analyzeSentiment(title),
    impact: analyzeImpact(title),
    articleAge: now - publishedTime
  };
}).filter(article =>
  article.title &&
  article.url &&
  Number.isFinite(article.articleAge) &&
  article.articleAge >= 0 &&
  article.articleAge <= MAX_AGE
);

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      success: true,
      total: articles.length,
      source: "Google News RSS",
      articles
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
