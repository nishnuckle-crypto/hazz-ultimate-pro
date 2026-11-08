export default async function handler(req, res) {
  try {
    const url = new URL(
      "https://api.gdeltproject.org/api/v2/doc/doc"
    );

    url.searchParams.set(
      "query",
      '(gold OR XAUUSD OR forex OR "Federal Reserve" OR CPI OR NFP OR FOMC OR inflation)'
    );
    url.searchParams.set("mode", "ArtList");
    url.searchParams.set("format", "json");
    url.searchParams.set("maxrecords", "50");
    url.searchParams.set("sort", "DateDesc");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`News source error: ${response.status}`);
    }

    const data = await response.json();

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

    return res.status(200).json({
      success: true,
      total: data.articles?.length || 0,
      articles: data.articles || []
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
