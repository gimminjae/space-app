# Space daily market briefings

These instructions implement the owner's authorized recurring publication. Publish both Korean and English editions immediately through the existing public writer's endpoint. Do not ask for approval each day, reconfigure schedules, post elsewhere, or commit daily manuscripts to Git.

## Workspace and destination

- Repository: `/Users/gimminjae/Documents/ChatGPT/경제 블로그/space-publication`
- Website: `https://space.service.io.kr`; writer: `/write`; publishing endpoint: `POST /api/publish`.
- Save each run's research, source notes, Markdown editions, chart input/output, bundle and receipt outside Git at `/Users/gimminjae/Documents/ChatGPT/경제 블로그/briefing-runs/<market>/<sessionDate>/`.
- Credentials already reside in the repository's `.env.local`. Load them only in the local publisher process. Never print keys, embed them in browser code, or put them in manuscripts.
- Existing articles and illustrations are stored in Supabase. The publisher uploads original charts to the existing private publication bucket, then uses the exact same API as the public writer. No site rebuild or manual Search Console submission is needed for each new article: the live sitemap, category, RSS and language links read the database.

## Date and holiday gate: do this before writing

Run `node scripts/briefing-session.mjs us` or `node scripts/briefing-session.mjs kr` in the repository. Use the current actual run date, not old dates in chat history.

- US: the 08:30 Asia/Seoul run covers the **previous Seoul calendar date's US equity trading session**. Use the session's New York date in the title and slug. Friday's US session belongs in Saturday morning's Korean briefing; Monday morning ordinarily has nothing to publish. DST changes neither the Korean trigger time nor this date rule. At 08:30 KST, US after-hours trading may still be in progress; label any such prices as a timestamped snapshot, never as the final regular close.
- Korea: the 21:30 Asia/Seoul run covers **the same Seoul date's KRX equity session**.
- If the target is a weekend or an exchange holiday, record a small local skip receipt and publish nothing. Do not substitute the last open day or turn a holiday into a weekend roundup.
- Check the current official exchange calendar and emergency closure notices. US: https://www.nyse.com/trade/hours-calendars and Nasdaq notices as needed. Korea: https://open.krx.co.kr/contents/MKD/01/0110/01100305/MKD01100305.jsp and current KRX market-operation notices. If the KRX page blocks a text fetch, use its public browser UI or another current official KRX notice; a general Korean public-holiday list is not sufficient (May 1/year-end/temporary closures differ).
- Confirm the target date in an actual closing-market report or official dated index data. Both calendar and closing evidence are required. A special or early closing session is an open day and should receive a briefing. Equity and bond market holidays can differ: timestamp each bond observation separately.
- If the market's open/closed status or the dated close cannot be verified, fail closed: do not invent data or publish yesterday's prices. Report the specific missing evidence.
- Check both deterministic article URLs before research: `/articles/<category>-<sessionDate>` and `/en/articles/<category>-<sessionDate>`. If both already exist, skip; if only one exists, report the partial publication without overwriting it. The helper also enforces the date, earliest scheduled time, unique slug and idempotent request key.

Categories are `us-market-briefing` (미장 브리핑 / US Market Briefing) and `kr-market-briefing` (한국장 브리핑 / Korea Market Briefing). A Korean title should display the trading date clearly, e.g. `미장 브리핑 | YYYY-MM-DD 미국 거래일: <the day's specific theme>`.

## Research and editorial standard

Read actual articles and primary releases available at the briefing's cutoff. Do not synthesize search snippets alone. Prefer exchange data, issuer investor-relations releases and filings, Federal Reserve, BLS, BEA, US Treasury, Bank of Korea, KRX, Statistics Korea/KOSIS, DART and relevant ministry releases. Supplement with reputable reporting such as Reuters, AP or Yonhap. Open at least five distinct useful source URLs per briefing; normally use 7–12 across different topics. Cross-check major closing levels and changes with a second reliable source where available. Save the exact URLs, publication dates, observation dates, retrieval cutoff and relevant facts in research notes.

Cover the whole day, with emphasis reflecting what actually mattered:

1. **Economy:** growth, inflation, employment, fiscal/trade developments and significant releases. Distinguish the release date from the month/quarter measured; state previous/consensus numbers only when sourced. No release today is a valid finding, not a reason to recycle old news as new.
2. **Stocks:** US S&P 500/Nasdaq/Dow, or Korean KOSPI/KOSDAQ; index levels and daily percent moves, sectors/breadth, volume or institutional/foreign flows when verified. Separate regular-session closes from futures and after-hours moves.
3. **Major companies:** usually 3–5 material earnings, guidance, regulatory, financing or business developments. Explain why they matter to beginners; distinguish announcements from speculation and price moves from proven causes. If fewer material items exist, say so and cover only verified ones.
4. **Rates and bonds:** the Fed/BOK policy stance; US 2-/10-year Treasury or Korean 3-/10-year government yields and daily basis-point changes if available. Distinguish policy rate, yield and bond price; explain their relationship in context. Never mix percent and percentage points/basis points.
5. **Currencies, commodities and ETFs:** USD/KRW and relevant dollar, oil/gold changes; implications for broad-index, sector, dividend and bond ETFs. Cite fund documents for fees/distributions; do not fabricate flows, treat yields as guaranteed income, or turn the briefing into personalized buy/sell advice. Briefings are not required to include monthly-dividend simulations when irrelevant.
6. **What comes next:** the next relevant scheduled data/events with dates and time zones, and two or three concrete questions readers can follow. Separate confirmed facts from interpretation and scenarios.

Write a coherent article that reads like a short chapter, using a concrete opening, explanatory transitions and plain language for a finance beginner. Avoid a mechanical list of headlines, formulaic hype, repeated boilerplate and assertions such as "X caused Y" without evidence. Paraphrase source reporting; do not copy news paragraphs or licensed charts. Link sources near factual claims with descriptive link text, plus a source list. Include a brief educational-purpose statement naturally at the end, not a long disclaimer.

Each language must take approximately **5–15 minutes**. Aim for around 3,500–6,500 Korean characters and 1,100–2,000 English words of substantive prose, adjusting to the day's news. Korean and English must carry the same core facts, numbers, units, dates, caveats and sources; rewrite English naturally rather than sentence-by-sentence translation. Review numbers across both editions before publishing. Never add filler or unverified news to meet a length target; if research is insufficient, report the problem instead of publishing a thin or fabricated article.

## Original visuals and manuscript files

Include a compact market dashboard table, another useful rate/event/company comparison table, and **at least one original numeric chart per language**. All visuals must use the same verified data as the article. Missing values are labeled unavailable or omitted; never imputed as zero. Clearly state observation times and chart sources. Use readable Korean labels, English labels in the English edition, descriptive alt text, and distinguish daily percentage changes from yield basis-point changes. Keep comparable units in a single chart.

Create `chart.json` in the run directory:

```json
{
  "sessionDate": "YYYY-MM-DD",
  "asOf": "YYYY-MM-DD HH:mm KST / regular-session closes",
  "title": {"ko": "주요 지수의 하루", "en": "Major indexes at the close"},
  "sourceLabel": {"ko": "출처: 실제 확인한 데이터 제공처 · 상세 링크는 본문", "en": "Source: verified data providers · links in the article"},
  "sources": ["https://actual-opened-source.example/path"],
  "rows": [
    {"label": {"ko": "실제 지수명", "en": "Actual index name"}, "changePct": 0.0}
  ]
}
```

This is a schema example, not real market data. Supply 3–8 genuinely comparable verified observations (for Korea, KOSPI/KOSDAQ/KOSPI 200 or relevant documented sector indexes; do not add a foreign index with a different session merely to fill a slot). Render both PNG files from that one input:

```sh
"/Users/gimminjae/Documents/ChatGPT/경제 블로그/briefing-tools/venv/bin/python" scripts/render-market-chart.py /absolute/run/chart.json /absolute/run/charts
```

Inspect both images at actual size for clipped text, font problems, axes, dates and numerical accuracy. These are original chart renders, not AI-generated market data. `ko.png` and `en.png` are 1200×630. Save finished prose as `ko.md` and `en.md` outside Git. Put `{{MARKET_CHART}}` at a natural point in each body. If a different chart is more useful, create it with a standard plotting library and preserve the same validation and provenance requirements.

## Publish the two editions atomically

Prepare `bundle.json` in the run directory:

```json
{
  "evidence": {
    "sessionStatus": "open",
    "sessionDate": "YYYY-MM-DD",
    "calendarUrl": "https://actual-official-calendar.example/",
    "closeUrl": "https://actual-dated-closing-report.example/"
  },
  "charts": {
    "ko": {"file": "charts/ko.png", "alt": "한국어로 실제 차트 내용을 설명"},
    "en": {"file": "charts/en.png", "alt": "An accurate description of this chart"}
  },
  "publication": {
    "kind": "article",
    "category": "us-market-briefing",
    "sessionDate": "YYYY-MM-DD",
    "dataAsOf": "YYYY-MM-DDTHH:mm:ss+09:00",
    "editions": [
      {"locale":"ko","title":"날짜와 주제가 있는 제목","seoTitle":"검색에 의미 있는 제목","summary":"이날의 핵심을 담은 구체적인 요약","author":"Space 편집부","tags":["미장 브리핑","경제","주식","ETF"],"sources":["https://actual-opened-source.example/path"],"content":"ko.md 전체 본문과 {{MARKET_CHART}}"},
      {"locale":"en","title":"Dated, specific English headline","seoTitle":"Useful English search title","summary":"Specific summary of this session","author":"Space Editorial","tags":["US Market Briefing","Economy","Stocks","ETFs"],"sources":["https://actual-opened-source.example/path"],"content":"Full en.md body with {{MARKET_CHART}}"}
    ]
  }
}
```

Replace every example value, include at least five actual sources in **each** edition, and put full Markdown text in the `content` values. Korean runs use `kr-market-briefing` and the appropriate names. `dataAsOf` is the real research cutoff with an offset.

```sh
node --import tsx scripts/publish-market-briefing.ts /absolute/run/bundle.json --check
node --env-file=.env.local --import tsx scripts/publish-market-briefing.ts /absolute/run/bundle.json
```

The first command validates both editions and images without external writes. The second uploads the charts, publishes both editions together through `/api/publish`, then checks the public articles, category listings, charts and live sitemap. It saves `publish-payload.json` and `publish-receipt.json` beside the bundle. On network uncertainty, inspect the receipt and both live URLs before retrying the identical saved content. Never change a previously used request key to force a duplicate. A 409 or partial publication needs investigation, not deletion or an overwrite.

After successful publication, inspect the public Korean and English pages in the browser, including a narrow screen. Confirm source links, tables, chart labels, reading time, category, canonical, alternate-language link and dates. Do not report success merely because a request was sent. The live sitemap being updated does **not** mean Google has already indexed the new URLs. Report completed publication with both links. Holiday and already-published runs should quietly record a skip; report actionable research, publication or verification failures accurately.
