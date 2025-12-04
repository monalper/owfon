// api/tefas.js

const TEFAS_URL = "https://www.tefas.gov.tr/api/DB/BindHistoryInfo";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // gelen body'yi aynen TEFAS'a forward et
    const tefasResp = await fetch(TEFAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "curl/8.7.1",
        "Accept": "*/*",
      },
      body: req.body, // Vercel Node 18'de req.body direkt kullanılabilir
    });

    const text = await tefasResp.text();
    res.status(tefasResp.status);
    res.setHeader(
      "Content-Type",
      tefasResp.headers.get("content-type") || "application/json; charset=utf-8"
    );
    res.send(text);
  } catch (err) {
    console.error("TEFAS proxy error:", err);
    res.status(502).json({ error: "TEFAS proxy failed" });
  }
}
