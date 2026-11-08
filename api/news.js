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

    const articles = items.map(item => ({
      title: getTag(item, "title"),
      source: getTag(item, "source") || "Google News",
      url: getTag(item, "link"),
      published_at: getTag(item, "pubDate")
    })).filter(article => article.title && article.url);

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
