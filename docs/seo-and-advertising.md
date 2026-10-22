# Space search and advertising operations

Checked on 2026-10-22. Production origin: https://space.service.io.kr

## Search implementation

- Translated public pages have self canonical URLs, Korean/English/x-default alternates, descriptions, Open Graph and Twitter cards.
- The sitemap currently includes 28 useful public URLs: home, about, privacy, course index and ten lessons in both languages.
- Future public member posts, nonempty member spaces, categories and tags are included automatically. Private/deleted posts, empty archives, search, account and admin pages are excluded.
- Empty archives use noindex, follow. Authentication/account pages retain noindex and server authentication. Invalid and nonexistent pagination returns not-found; page 1 links omit the page query.
- Member article bodies are not translated by changing the interface language. Both interfaces point to the original article URL as canonical; the sitemap contains that URL once. The authored bilingual lessons retain separate canonicals and language alternates.
- Home exposes WebSite and Organization data. Lessons expose Article and BreadcrumbList; member articles expose BlogPosting and BreadcrumbList.
- Sitemap: https://space.service.io.kr/sitemap.xml
- The Space URL-prefix Search Console property was verified through existing parent-domain ownership. The sitemap was resubmitted on October 22 and Google confirmed submission. Google subsequently re-read it on October 22 and showed **Success / 28 discovered pages**. Discovery is not a claim that all 28 are indexed. The lesson hub was not yet known to Google; its manual indexing request failed with a reCAPTCHA connection error.

## Advertising state and activation

The AdSense account initially displayed “계정이 승인되지 않았습니다.” The October 20 notification confirmed non-approval without a precise page-level cause. After explicit user approval of the policy-compliance declaration, it was resubmitted and management menus became available.

The existing `service.io.kr` entry was confirmed in Sites. Its review was requested using the matching ads.txt declaration. Google now displays **“준비 중 / 사이트의 광고 게재 가능 여부 검토 중 / 리뷰가 요청됨”**. This is a submitted review, not approval. Google manages ordinary subdomains under the parent domain; an independent `space.service.io.kr` Sites entry is not supported.

The publisher ID is `ca-pub-4493633870090510`. Space and parent-domain ads.txt both returned the matching publisher entry over HTTPS. The AdSense table had not yet refreshed its previous “찾을 수 없음” ads.txt status, so Google verification remains pending. The parent root is a separate product; its content was not changed.

Created a responsive display unit **Space · article footer · responsive**, ID **7049280531**, and configured `ADSENSE_ARTICLE_SLOT` in Space's production environment. The provided Google snippet matches the implemented unit. The parent site's Auto ads setting was already **사용 안 함** and was left unchanged. Other sites' advertising settings were not changed.

A single display-unit position is prepared at the end of article content, clearly labeled Advertisement/광고. No ad loader is installed in login, signup, search, navigation, empty archives, or admin pages. Unfilled units collapse. No placeholder or empty box renders while disabled.

**Remaining blocker:** the Google Privacy & messaging European-regulations editor and settings screen remain blank/loading, including after reloading and navigating through both official menu routes. Browser console reports `Could not find event bus in current window context` in Google's user-messaging script. No consent message was created or published, and no browser security settings/extensions were altered to work around it.

Production `ADSENSE_ENABLED=false` and `ADSENSE_CONSENT_READY=false` are explicit. Before activation:

1. Wait for the `service.io.kr` Sites status to become Ready, and confirm ads.txt is recognized. Do not resubmit repeatedly or create another account.
2. Once Google's message editor loads, publish a certified consent message for Space, with an equally accessible reject choice, and verify geographic coverage, policy URL, language and consent withdrawal. Confirm scope if Google's site-level configuration also affects other products under the parent domain. Complete applicable US-state choices as well.
3. Verify the actual consent flow and set `ADSENSE_CONSENT_READY=true`; the ad unit ID is already configured.
4. Confirm Auto ads remains off. Set `ADSENSE_ENABLED=true` and redeploy only after approval and consent readiness. Inspect one page without clicking ads; confirm no ad script on account/search/admin pages. Never manufacture ad traffic or clicks.

No ads are currently served by Space. Real serving and regional consent cannot be claimed as verified before these steps.

Search indexing and AdSense approval are external decisions; sitemap acceptance alone is not indexing, and source integration is not live ad delivery.

## Verification

- `npm test`: 13 passing tests, including pagination edge cases, ad activation gates, data permissions and bilingual content.
- `npm run typecheck` and `npm run build`: passed.
- `node scripts/check-seo.mjs http://127.0.0.1:3102 docs/seo-local-checks.json`: 28 sitemap pages and 56 routes passed. This snapshot expects the current database's empty public member archives; update its fixture assumptions once member posts are published.
- `node scripts/check-lessons.mjs http://127.0.0.1:3102`: all 20 editions, 2 hubs, 30 assets, feeds, search, language pairs and metadata passed.
- Production deployment `6ad9fdd6e47c4efc8b222a8b`, commit `2fb89a5e2ea08f14971665c0e68f8e0103c1dd23`, was published at 2026-10-22T12:13:55Z. Production SEO checks passed for 28 sitemap pages / 56 routes; all 20 editions, 2 hubs and 30 images passed again. Browser language switching and article rendering were checked.
- `docs/seo-production-checks.json` contains the deployed HTTP results.
- The expanded public-post relationship query was checked against the actual database with the anonymous key. No production data or schema was modified.

## Official references

- [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [AdSense site and subdomain management](https://support.google.com/adsense/answer/12170421)
- [AdSense program policies](https://support.google.com/adsense/answer/48182)
- [Google-certified CMP requirements](https://support.google.com/adsense/answer/13554116)
