export default async function handler(req, res) {
  try {
    const url = new URL(
      "https://showmytrades.com/api/public/calendar/v1"
    );

    url.searchParams.set(
      "currency",
      "USD,EUR,GBP,JPY"
    );

    url.searchParams.set(
      "impact",
      "high,medium,low"
    );

    url.searchParams.set("days", "14");
    url.searchParams.set("format", "json");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Calendar API error: ${response.status}`
      );
    }

    const data = await response.json();

    res.setHeader(
      "Cache-Control",
      "s-maxage=900, stale-while-revalidate=300"
    );

    return res.status(200).json({
      success: true,
      source: "ShowMyTrades Economic Calendar",
      server_time: data.server_time,
      total: data.events?.length || 0,
      events: data.events || []
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
