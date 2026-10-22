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
- The Space URL-prefix Search Console property was verified through the existing parent-domain ownership. Final sitemap submission/production checks are recorded separately after deployment.

## Advertising state and activation

The AdSense account currently displays “계정이 승인되지 않았습니다.” The October 20 notification confirms non-approval but does not identify a precise page-level cause. Site/ad-unit management redirects to onboarding. Do not describe this as approved or as live ad serving.

Google manages ordinary subdomains under the registrable parent domain (`service.io.kr`), not as independent Sites entries. The publisher ID is `ca-pub-4493633870090510`. Both Space's ads.txt and the parent-domain ads.txt returned the matching publisher entry. The parent site is a separate product; no parent-site content or advertising settings were changed.

A single responsive display-unit position is prepared at the end of article content, clearly labeled Advertisement/광고. No ad loader is installed in login, signup, search, navigation, empty archives, or admin pages. Unfilled units collapse. No placeholder ad or empty box renders while disabled. Actual ad dimensions/serving cannot be tested until the account and site are approved.

Production `ADSENSE_ENABLED` is set to false while approval is unresolved. Before activation:

1. The account owner confirms the policy-compliance declaration required by AdSense's resubmission screen. Submit for review and wait for the actual approval status.
2. Confirm `service.io.kr` is approved in Sites and Space is eligible under that parent. Do not create a second AdSense account or an unsupported subdomain entry.
3. Create a responsive display ad unit for the Space article footer; set its real 10-digit ID as `ADSENSE_ARTICLE_SLOT` in the Space hosting environment.
4. Publish a Google-certified CMP message covering the required regions and Space host. Verify consent choices in the browser. Set `ADSENSE_CONSENT_READY=true` only after verification.
5. Disable Auto ads for Space before activation so overlays, anchors or extra in-page placements do not bypass the single-footer design. If the setting affects other parent-domain products, coordinate that scope first.
6. Set `ADSENSE_ENABLED=true`, redeploy, inspect one real page without clicking ads, and confirm no ad script on account/search/admin pages. Never manufacture ad traffic or clicks for testing.

Search indexing and AdSense approval are external decisions; sitemap acceptance alone is not indexing, and source integration is not live ad delivery.

## Verification

- `npm test`: 13 passing tests, including pagination edge cases, ad activation gates, data permissions and bilingual content.
- `npm run typecheck` and `npm run build`: passed.
- `node scripts/check-seo.mjs http://127.0.0.1:3102 docs/seo-local-checks.json`: 28 sitemap pages and 56 routes passed. This snapshot expects the current database's empty public member archives; update its fixture assumptions once member posts are published.
- `node scripts/check-lessons.mjs http://127.0.0.1:3102`: all 20 editions, 2 hubs, 30 assets, feeds, search, language pairs and metadata passed.
- The expanded public-post relationship query was checked against the actual database with the anonymous key. No production data or schema was modified.

## Official references

- [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [AdSense site and subdomain management](https://support.google.com/adsense/answer/12170421)
- [AdSense program policies](https://support.google.com/adsense/answer/48182)
- [Google-certified CMP requirements](https://support.google.com/adsense/answer/13554116)
