# Space 입문 강의 운영

## 공개 경로

- 한국어 목차: https://space.service.io.kr/learn
- 영어 목차: https://space.service.io.kr/en/learn
- 한국어 본문: `/learn/{slug}`
- 영어 본문: `/en/learn/{slug}`
- 시리즈 RSS: `/learn/feed.xml`, `/en/learn/feed.xml`
- 기본 RSS `/feed.xml`에도 한국어 강의 10편을 포함합니다.

2026-10-22에 작성한 한국어 10편과 영어 10편을 기본 공개 연재로 구성했습니다. 홈의 추천 강의, 공통 메뉴, 사이트 내 검색, 목차, 이전·다음 편 이동으로 접근합니다. 계정이 없어도 전문을 읽습니다.

## 원고와 편집

원고는 `content/learn/ko/`, `content/learn/en/`의 개별 Markdown 파일입니다. `manifest.json`에서 제목, 검색 제목, 요약, 순서, 태그, 읽기 시간, 발행·수정 시각을 관리합니다. `SOURCES.md`는 원고의 자료 출처와 계산 가정입니다.

`npm run content:build`가 본문의 중복 제목과 파일용 탐색 문구를 제거하고, 상대 Markdown 링크와 이미지 경로를 실제 사이트 경로로 바꿉니다. 결과는 `articles.generated.json`이며 직접 고치지 않습니다. `npm test`, `npm run build` 전에도 자동 실행합니다. 원고를 고칠 때 두 언어의 의미와 수치, 공유 이미지의 제목을 함께 확인하고 실제 수정 시에만 `updatedAt`을 바꿉니다.

차트 PNG 8개와 공유 이미지 PNG 22개는 `public/learn-assets/`에 있습니다. 본문 차트에는 설명형 대체 텍스트와 크기를 제공하고, 원고의 표·가정·출처를 함께 보존합니다. 원본 SVG와 최초 배포용 Markdown 묶음은 별도의 `space-economy-course` 산출물에 있습니다.

이 연재는 코드와 함께 버전 관리하는 사이트 기본 콘텐츠입니다. 회원의 Supabase 게시글이나 관리자 편집기에 추가되는 데이터가 아닙니다. 기본 연재 수정은 위 Markdown 파일을 고친 후 배포합니다. 회원 글의 작성·권한·비공개 기능은 기존 흐름을 유지합니다.

## 검색 노출 설정

- 언어별 고유 제목·설명·canonical URL, 상호 hreflang 및 x-default.
- 서버에서 렌더링하는 전체 본문, 단일 H1, 절별 H2와 목차 링크.
- 글별 Article 및 BreadcrumbList, 목차의 CollectionPage·ItemList·CreativeWorkSeries JSON-LD.
- 언어별 Open Graph·Twitter 공유 이미지, 발행일·수정일·발행 주체 표시.
- sitemap.xml에 목차 2개와 본문 20개, 언어별 차트 이미지와 실제 수정일 추가.
- 사이트 내 검색은 계속 noindex,follow. 존재하지 않는 강의는 404.

구현 기준: [Google 언어별 페이지 안내](https://developers.google.com/search/docs/specialty/international/localized-versions), [Article 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/article), [사이트맵 안내](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). 검색 등록·순위는 이 구현이나 HTTP 점검만으로 확인되지 않습니다.

## 확인과 배포

`npm run typecheck`, `npm test`, `npm run build`를 실행합니다. 서버를 실행한 후 `node scripts/check-lessons.mjs http://127.0.0.1:3180 docs/learn-local-checks.json`으로 전체 20편·22개 페이지·이미지 30개·검색·RSS·메타데이터·사이트맵을 확인합니다. 운영에서는 같은 스크립트의 첫 인수를 `https://space.service.io.kr`로 바꿉니다.

운영 기반은 `master`의 `07c3e3f`였습니다. 기존 `feat/economy-reader-tools`의 별도 경제 기능·DB 마이그레이션은 이 배포에 포함하지 않았습니다. 해당 브랜치를 이어갈 때 최신 master의 강의·검색·사이트맵·Markdown 변경을 병합해야 합니다.

배포 후의 검증 결과는 `learn-production-checks.json`에 기록합니다. Google Search Console의 실제 색인 상태와 검색 순위는 별도 확인 대상입니다.

언어별 RSS는 서로 다른 경로를 사용합니다. 운영 CDN이 쿼리 매개변수만 다른 RSS 응답을 공유하는 현상을 확인하여, 영어판에 `/en/learn/feed.xml`을 별도로 배정했습니다.

## 운영 확인 완료

- 확인 시각: 2026-10-22T11:50:51.273Z.
- 운영 코드 커밋: `9694f543a7ee49550cd4c25cb3207f62fa304ad4`.
- Netlify 배포: `6ad9f82a98a38cbe802df214`, 2026-10-22 11:49:41 UTC에 공개 완료.
- 공개 본문 20편, 목차 2개, 이미지 30개, 검색·한영 RSS·canonical·hreflang·JSON-LD·사이트맵·404 점검 통과.
- 브라우저에서 로컬 48개 화면과 운영 12개 화면을 390px·1440px로 확인. 언어 전환과 JavaScript 비활성화 상태의 본문 표시 통과.
- 기존 사이트 HTTP 18개 점검, 단위·권한 테스트 11개 및 프로덕션 빌드 통과.
- Google Search Console의 색인 현황·검색 순위는 확인하지 않았습니다.

증거 파일: `learn-production-checks.json`, `learn-production-browser-checks.json`, `learn-production-smoke.json`. 이 운영 기록만 추가하는 커밋은 `[skip netlify]`로 불필요한 재배포를 생략합니다.
