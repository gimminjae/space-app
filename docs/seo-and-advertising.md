# Space search and advertising operations

Last checked: 2026-10-22. Production: https://space.service.io.kr

## Public content and search

- Content-only mode publishes 10 introductory lessons and 17 ETF articles, each in Korean and English. The sitemap has **64 URLs**: 54 articles, two course hubs, two ETF hubs, and home/about/privacy in both languages.
- Each translated page has a self canonical, language alternates, description, Open Graph and Twitter metadata. Articles include source links, review dates, structured data, internal navigation, feeds and Markdown downloads.
- Login, registration, personal tools, member archives and their endpoints are temporarily unavailable. Their data has not been deleted. Search pages and unavailable routes are excluded from indexing and the sitemap.
- Sitemap: https://space.service.io.kr/sitemap.xml
- The existing Space URL-prefix property is verified. On October 22 the updated sitemap was resubmitted; Search Console reported **Success / 64 discovered pages**, up from 28. The submission and read dates both show October 22.
- The ETF hub inspection showed **Discovered — currently not indexed**, with this sitemap recognized. Its individual indexing request failed because Google's reCAPTCHA service could not connect. No CAPTCHA was bypassed, no repeated requests were made, and successful individual submission is not claimed.
- Sitemap acceptance and discovery are not proof of indexing. Google determines crawl and indexing timing.

## AdSense status observed on October 22

- Account: `pub-4493633870090510`.
- The user recreated the parent-domain entry `service.io.kr`. Its review was requested on **October 22, 2026 at 21:36 KST**.
- Sites shows **Preparing / under review** and **ads.txt Authorized**. This is not approval.
- With `service.io.kr` selected, Home shows all setup steps completed, payment information checked, and the site connected.
- Policy Center shows **no current policy violations**. That does not imply the pending site review has passed.
- The pending entry was not deleted, recreated or resubmitted again. The separate Tistory entry was not changed.
- Google manages ordinary subdomains under their parent-domain site. The parent root is a separate product; this task changes Space only.
- Both parent-domain and Space ads.txt contain the matching publisher entry.

## Approval-readiness improvements

The Korean and English About and Privacy pages now provide:

- The operator's existing public contact address, also published on service.io.kr, with direct email links.
- Editorial source selection, dated statistics, illustrative-calculation labeling, and a correction request process.
- An explanation that the ETF series revises the operator's own Tistory originals, with links to those originals and primary references in each article.
- Accurate descriptions of the current content-only service and retained legacy accounts.
- Advertising cookie disclosures covering prior visits to this and other sites, Google and participating third-party personalization choices, and links to Google's data-use explanations.
- A clear distinction between the current disabled-ad state and future advertising processing. Reading the policy is not consent.
- Hosting, external font requests, public downloads and privacy contact information.

About also includes matching AboutPage/Organization contact structured data. About and Privacy have dated sitemap entries. These are quality and transparency improvements, not a guarantee of AdSense approval or a certification of legal compliance.

## Advertising activation

One responsive display position is prepared at the article footer, labeled Advertisement/광고. Unit: **Space · article footer · responsive**, ID **7049280531**. The loader does not run on search, account, empty archive or administration pages; unfilled units collapse.

Production `ADSENSE_ENABLED=false` and `ADSENSE_CONSENT_READY=false`. Ads remain disabled.

Before activating:

1. Wait for `service.io.kr` to become Ready. ads.txt is now recognized; review remains pending.
2. Complete and verify the applicable certified consent flow. In the earlier setup, Google's Privacy & messaging editor failed to load with a user-messaging event-bus error; no message was published. This check did not establish that a working consent flow now exists. Confirm scope before applying a parent-domain setting to other products, and verify language, rejection, withdrawal and applicable regional choices.
3. Confirm Auto ads remains off (it was off at the earlier setup), then set `ADSENSE_CONSENT_READY=true` only after testing real consent behavior.
4. Set `ADSENSE_ENABLED=true` and redeploy after approval and consent readiness. Inspect rendering without clicking ads. Never manufacture ad traffic or clicks.

## Verification and evidence

The ETF publication was deployed in commit `b493aaa42606f1df185da502491dc633a880a1d3`, Netlify deploy `6ada149ab1c2308926e74018`. Its 64 sitemap pages / 124 route checks, all 34 ETF editions and downloads, and the existing bilingual lessons passed production checks.

For this follow-up, evidence is saved beside the checkout in `../search-adsense-review/`:

- `sitemap-64-pages.png`: Search Console Success / 64 discovered pages.
- `adsense-under-review.png`: service.io.kr review requested and pending.
- `adsense-policy-center.png`: no current policy violations.
- `index-request-error.png`: Google reCAPTCHA connection failure.

Source and deployment checks for the follow-up are recorded there separately. No production database data or schema was changed.

## Official references

- [Google recrawl requests and sitemap discovery](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
- [AdSense site status](https://support.google.com/adsense/answer/12170222)
- [AdSense ads.txt status](https://support.google.com/adsense/answer/12171612)
- [Required privacy disclosures](https://support.google.com/adsense/answer/1348695)
- [AdSense content readiness](https://support.google.com/adsense/answer/12176698)
- [Google-certified CMP requirements](https://support.google.com/adsense/answer/13554116)
