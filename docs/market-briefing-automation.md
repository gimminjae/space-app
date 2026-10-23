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

Research the following broad coverage universe every trading day, then select the **3–5 developments that best explain this particular session**. Keep a concise core-market dashboard, but give more space to material, well-sourced changes and connections. Do not force every candidate topic or a fixed number of company stories into every article. The same selection and emphasis must carry into the English edition.

1. **Korean market foundation:** KOSPI, KOSDAQ and USD/KRW. Show verified levels and daily changes, then explain the recent direction using roughly five and twenty trading sessions where comparable data is available. Connect sector leadership, large-cap versus growth-stock performance, foreign/institutional/retail net flows and the won's movement when evidence supports the connection. Identify the USD/KRW quote convention and timestamp; an increase means more won per dollar, not a stronger won. Distinguish the Seoul equity close, FX daytime close and later FX observations. Include meaningful US/global spillovers with their own observation dates.
2. **US/global market foundation:** **Nasdaq-100** and S&P 500, gold, silver and dollar strength/weakness. Do not silently substitute the Nasdaq Composite for Nasdaq-100; label a supplement or an ETF proxy explicitly. Track a verified dollar index such as DXY and relevant major currency pairs, including USD/KRW when useful. Do not infer broad dollar strength from a single bilateral exchange rate. Identify gold/silver spot versus futures, currency, unit, contract and time; never mix them to manufacture a trend. Explain recent five-/twenty-session direction where sourced and connect equities, precious metals, real/nominal yields and the dollar without assuming that historical relationships always hold. The Dow, Nasdaq Composite, oil and other markets are candidates when they add explanatory value.
3. **Economy and consequential institutional announcements:** growth, inflation, employment, trade/fiscal policy; Fed/FOMC and Bank of Korea rate decisions, minutes and official speeches; ECB/BOJ and other central banks when relevant; major government/statistical agency releases and IMF/OECD or regulatory announcements that affect the session. Explain the actual decision or release, the previous reading, credible pre-release expectations if available, and the market's observed response. Separate an unchanged policy rate from changes in guidance or market pricing. Distinguish the announcement date, reference period and future effective date. Do not present a scheduled future announcement as already released or force an old release into today's news.
4. **Rates and bonds:** policy stance versus US 2-/10-year Treasury and Korean 3-/10-year government yields; the curve, real yields, credit spreads, auctions and rate-expectation changes when material and verified. Keep percentage changes, percentage-point changes and basis points distinct; explain the bond-price/yield relationship for a beginner. Compare consistent maturities and timestamps, and label observations from a different bond trading day.
5. **Major companies and ETFs:** select material earnings, guidance, regulatory, financing, investment and business developments. Explain their index/sector significance and implications for broad-index, sector, dividend, precious-metal and bond ETFs. Attribute announcements and distinguish proven facts from speculation. Cite fund documents for fund-specific claims; do not fabricate distributions/flows or treat yield as guaranteed income. Monthly-dividend simulations are optional when genuinely relevant to the day's subject.
6. **Market psychology:** assess risk appetite using observable evidence, for example VIX/VKOSPI, options put/call measures, market breadth, turnover, credit spreads, fund-flow data and investor surveys. Explain what each selected measure covers and its limitations; use at least two independent signals before making a broad claim about sentiment when available. Separate measured indicators, surveyed opinions and the writer's interpretation. Label each observation date and avoid unsupported labels such as universal panic, euphoria, or "smart money knows." Conflicting signals are a useful finding, not something to conceal.
7. **Global investors' capital flows and stated intentions:** look for significant new public evidence from major asset managers, pension/sovereign funds, hedge funds and influential investors. Candidate sources include official filings and shareholder letters, fund disclosures, verified ETF creations/redemptions or net-flow reports, KRX investor flows, CFTC positioning and attributable interviews. Link cross-border and stock/bond/cash/gold allocation shifts to the day's theme only when supported. Identify the investor or investor class, asset, amount/units, measurement period and original source. Distinguish **observed transactions or net flows**, **disclosed holdings/position changes**, and **expressly stated views or plans**; commentary or a research house outlook is not proof of a fund trade. A change in AUM or portfolio market value is not by itself a net inflow. Do not attribute an aggregate investor-class statistic to a specific individual. Do not guess a person's private motives or treat a widely quoted investor's old position as today's action.
8. **What comes next:** choose the next material releases, central-bank events, earnings or policy dates and explain what would confirm or challenge the current interpretation. Give explicit dates/time zones and two or three concrete questions to watch, separating facts from conditional scenarios.

For each chosen theme, build the explanation in this order: **what changed → recent trend → verified drivers and plausible contributing factors → observed reaction and related capital flows/sentiment → what to watch next**. Distinguish attribution in reporting from a demonstrated causal link. Where evidence is mixed, describe competing explanations instead of asserting a single cause. Trading volume alone is not a market-wide net capital inflow; every secondary-market trade has both a buyer and a seller.

### Freshness and limits of investor data

Always label the **holdings/observation date, covered period and publication date**. Delayed holdings reports and weekly surveys are context, not a live feed. In particular, use the current [SEC Form 13F guidance](https://www.sec.gov/rules-regulations/staff-guidance/frequently-asked-questions-about-form-13f) and [CFTC COT methodology and schedule](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) when interpreting these sources. A 13F is a report of covered holdings and does not establish an entire portfolio, exact transaction dates or the investor's current intention. COT reports describe aggregate positioning; they do not disclose an individual trader's reasons. Do not reconstruct purchases solely from changing position market values. If a flow or intention cannot be verified, omit it or state that it is unavailable; do not turn the absence of a new disclosure into a claim that no trades occurred.

Write a coherent article that reads like a short chapter, using a concrete opening, explanatory transitions and plain language for a finance beginner. Avoid a mechanical list of headlines, formulaic hype, repeated boilerplate and assertions such as "X caused Y" without evidence. Paraphrase source reporting; do not copy news paragraphs or licensed charts. Link sources near factual claims with descriptive link text, plus a source list. Include a brief educational-purpose statement naturally at the end, not a long disclaimer.

Each language must take approximately **5–15 minutes**. Aim for around 3,500–6,500 Korean characters and 1,100–2,000 English words of substantive prose, adjusting to the day's news. Korean and English must carry the same core facts, numbers, units, dates, caveats and sources; rewrite English naturally rather than sentence-by-sentence translation. Review numbers across both editions before publishing. Never add filler or unverified news to meet a length target; if research is insufficient, report the problem instead of publishing a thin or fabricated article.

## Original visuals and manuscript files

Include a compact market dashboard table, another useful rate/event/company/flow comparison table, and **at least one original numeric chart per language**. For a multi-session trend story, prefer a line chart of sourced historical observations (or a clearly labeled common-base indexed comparison) over a single-day bar chart. A one-day bar chart is appropriate for a session-performance comparison; it is not evidence of a multi-week trend. Use the available observations only, with no invented history or interpolation presented as actual prices. All visuals must use the same verified data as the article. Missing values are labeled unavailable or omitted; never imputed as zero. Clearly state observation times and chart sources. Use readable Korean labels, English labels in the English edition, descriptive alt text, and distinguish daily percentage changes from yield basis-point changes. Keep comparable units in a single chart.

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
