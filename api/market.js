
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "Twelve Data API key is missing"
    });
  }

  const interval = req.query.interval || "15min";

  const allowedIntervals = [
    "1min",
    "5min",
    "15min",
    "30min",
    "1h",
    "4h"
  ];

  if (!allowedIntervals.includes(interval)) {
    return res.status(400).json({
      success: false,
      error: "Invalid timeframe"
    });
  }

  try {
    const url = new URL(
      "https://api.twelvedata.com/time_series"
    );

    url.searchParams.set("symbol", "XAU/USD");
    url.searchParams.set("interval", interval);
    url.searchParams.set("outputsize", "30");
    url.searchParams.set("apikey", apiKey);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.status === "error" || !data.values) {
      return res.status(502).json({
        success: false,
        error: data.message || "Market data unavailable"
      });
    }

    return res.status(200).json({
      success: true,
      symbol: "XAUUSD",
      timeframe: interval,
      candles: data.values.map(candle => ({
        datetime: candle.datetime,
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close)
      })),
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Unable to connect to market data provider"
    });
  }
}

