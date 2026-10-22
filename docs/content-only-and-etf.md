# Content-only publication and ETF series

Updated 2026-10-22. The owner authorized hiding login, signup and personal services, preserving existing data, and publishing all articles from their Tistory ETF category in updated Korean and English editions.

## Current behavior

- Header and footer lead to public editorial content, search, language selection and publication information.
- `src/lib/platform-mode.ts` enables content-only mode. The proxy rejects account, login, signup, recovery, onboarding, studio, member-space, auth callback and API routes with 404 and `X-Robots-Tag: noindex, nofollow`, including localized and encoded variants.
- Session reads and user-required operations have server-side guards. Public landing, search, sitemap and feeds do not query member posts in this mode. Old member category, tag and legacy post routes return 404. Existing database records, storage objects and source files were not deleted.
- This is a temporary operating mode, not a database migration. Restoring personal services requires reviewing the mode flag, navigation, privacy copy and operational tests together; flipping the flag alone does not restore the editorial UI changes.

## Publication sources

`content/etf/manifest.json` maps all 17 distinct original URLs to 17 new slugs: 15 fund introductions and two comparisons. Each has Korean and English Markdown, dated issuer sources, an original-source link and a table. Fifteen topics also use an original explanatory diagram; ACE and IDVO use tables to explain holdings and currency layers.

Facts were reviewed on 2026-10-22. Reported observations retain their own reporting dates. No live-price promise is made. The rewrite corrects SCHD split comparisons, DIVO/QDVO fees, GPIX/GPIQ names and conditional net fees, short track records, distribution-versus-return confusion and unsupported future projections. US tax descriptions are not presented as a universal Korean tax benefit.

## Editing

1. Edit `content/etf/ko/<slug>.md` and `content/etf/en/<slug>.md`, and the corresponding manifest metadata and dates.
2. Run `npm run content:build`. It generates the rendering data and individual public Markdown downloads and validates a 5–15 minute reading estimate using a deliberate beginner pace plus figure/table reading time.
3. `scripts/generate-etf-assets.py` creates six original SVG diagrams and 36 PNG social cards. It requires Python, Pillow and the macOS Apple SD Gothic Neo font. Assets are committed; production builds do not need Python.
4. Run `npm test`, `npm run typecheck`, `npm run build`, then the HTTP checks against a production server.

Canonical URLs are `/category/etf`, `/etf/<slug>` and their `/en` counterparts. The `/etf` hub redirects to the category. Search includes both lesson and ETF manuscripts. The root Korean feed contains 27 articles; separate ETF feeds contain all 17 editions in their own language. The sitemap contains 64 public editorial URLs, with language alternatives. Google indexing is separate from correct publication metadata.

## Validation

- `npm test`: content integrity, 17-to-17 source mapping, language completeness, local assets, feeds, private-path detection and existing data/security tests.
- `node scripts/check-etf.mjs <origin> [report]`: 34 rendered full articles, two hubs, source links, 34 downloads, 42 assets, search, RSS and sitemap.
- `node scripts/check-seo.mjs <origin> [report]`: 64 indexable pages, canonical/social metadata, JSON-LD, 404 exclusions and disabled auth mutation.
- `node scripts/check-lessons.mjs <origin> [report]`: existing 20 lesson editions and their assets.
- Browser inspection covers the category, article, figure and English/mobile reading experience. Real physical devices and every browser are not implied by viewport checks.

AdSense activation and consent gates remain unchanged. This publication does not imply advertising approval or Google indexing.
