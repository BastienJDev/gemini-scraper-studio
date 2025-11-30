import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 4000;

const normalize = (text = "") =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const buildOccurrences = (text, query, pageUrl, pageTitle, siteName) => {
  if (!query) return [];
  const contentNorm = normalize(text);
  const normQuery = normalize(query.trim());
  const terms = normQuery.split(/\s+/).filter((t) => t.length > 2);

  const matches = [];
  const findStart = () => {
    const fullIdx = contentNorm.indexOf(normQuery);
    if (fullIdx !== -1) return fullIdx;
    for (const t of terms) {
      const idx = contentNorm.indexOf(t);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  let cursor = 0;
  while (true) {
    const idx = contentNorm.indexOf(normQuery, cursor);
    if (idx === -1) break;
    cursor = idx + normQuery.length;
    matches.push(idx);
    if (matches.length > 5) break; // cap occurrences per page
  }
  if (matches.length === 0) {
    const idx = findStart();
    if (idx === -1) return [];
    matches.push(idx);
  }

  const occurrences = [];
  for (const idx of matches) {
    // Extract snippet around index
    const separators = /[\.?!]/g;
    let start = 0;
    let end = text.length;
    let m;
    while ((m = separators.exec(text)) !== null) {
      if (m.index < idx) start = m.index + 1;
      else if (m.index > idx && end === text.length) {
        end = m.index + 1;
        break;
      }
    }
    const rawSnippet = text.substring(Math.max(0, start - 40), Math.min(text.length, end + 40));
    const cleaned = rawSnippet
      .replace(/#+/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s([,.!?;:])/g, "$1")
      .trim();
    const maxLen = 260;
    const snippet = cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}...` : cleaned;

    occurrences.push({
      siteName: siteName || pageTitle || pageUrl,
      pageTitle: pageTitle || pageUrl,
      pageUrl,
      snippet,
    });
  }

  return occurrences;
};

app.post("/scrape", async (req, res) => {
  const { url, query } = req.body || {};
  if (!url) return res.status(400).json({ success: false, error: "url required" });

  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    const pageTitle = await page.title();
    const textContent = await page.evaluate(() => document.body.innerText || "");
    const trimmedContent = textContent.slice(0, 60000);
    const occurrences = buildOccurrences(trimmedContent, query || "", url, pageTitle, "");

    res.json({
      success: true,
      url,
      title: pageTitle,
      content: trimmedContent,
      occurrences,
    });
  } catch (error) {
    console.error("Scrape error", error);
    res.status(500).json({ success: false, error: "scrape failed" });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Playwright scraper running on port ${PORT}`);
});
