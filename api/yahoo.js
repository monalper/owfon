// api/yahoo.js

const YAHOO_URL_TEMPLATE =
  "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1m&range=1d";

export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "symbol is required" });
  }

  const remoteUrl = YAHOO_URL_TEMPLATE.replace(
    "{symbol}",
    encodeURIComponent(symbol)
  );

  try {
    const yfResp = await fetch(remoteUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
      },
    });

    const text = await yfResp.text();
    res.status(yfResp.status);
    res.setHeader(
      "Content-Type",
      yfResp.headers.get("content-type") || "application/json; charset=utf-8"
    );
    res.send(text);
  } catch (err) {
    console.error("Yahoo proxy error:", err);
    res.status(502).json({ error: "Yahoo proxy failed" });
  }
}
