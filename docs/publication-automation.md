# Space 공개 글 작성과 자동화

작성 주소: https://space.service.io.kr/write · 영어 화면: https://space.service.io.kr/en/write

로그인이나 API 키 없이 제출하면 **즉시 공개**됩니다. 목록, 검색, 사이트맵, RSS, Markdown 다운로드는 Supabase의 발행 데이터를 읽으므로 별도 빌드가 필요 없습니다. 이 기능은 새 글을 작성하며 기존 글 수정·삭제는 지원하지 않습니다.

## 자동 발행

`POST https://space.service.io.kr/api/publish`에 `Content-Type: application/json`으로 아래 형식을 보냅니다. 서버 자동화에는 쿠키나 `Origin` 헤더가 필요 없습니다. 다른 웹사이트의 브라우저에서 직접 보내는 교차 출처 요청은 허용하지 않습니다.

```json
{
  "kind": "article",
  "slug": "understanding-compound-growth",
  "idempotencyKey": "717b0400-1d52-42a8-a9d2-a43aff1531ab",
  "editions": [
    {
      "locale": "ko",
      "title": "복리를 이해하는 첫걸음",
      "seoTitle": "복리란 무엇인가: 재테크 입문자를 위한 기초",
      "summary": "이자가 원금에 더해지는 과정을 작은 숫자로 살펴봅니다.",
      "author": "space",
      "content": "## 돈이 쌓이는 방식\n\n복리는 이전 기간의 이자가 다음 기간의 계산에 함께 들어가는 방식입니다. 다만 투자 수익률은 매년 같지 않으므로, 일정한 비율을 적용한 계산은 원리를 설명하기 위한 예시로 읽어야 합니다. 비용과 세금도 실제 결과에 영향을 줍니다.",
      "tags": ["경제", "복리"],
      "sources": [],
      "coverImage": ""
    },
    {
      "locale": "en",
      "title": "A first look at compound growth",
      "summary": "Follow how earlier interest can become part of the next calculation.",
      "author": "space",
      "content": "## How growth accumulates\n\nCompounding includes earlier interest in the amount used for the next calculation. Investment returns do not stay constant, so a fixed-rate calculation illustrates a mechanism rather than a promised outcome. Fees and taxes also affect actual results.",
      "tags": ["Economics", "Compounding"],
      "sources": []
    }
  ]
}
```

새 글마다 새로운 UUID를 `idempotencyKey`로 생성하세요. 연결 오류로 같은 글을 재시도할 때는 **같은 식별자와 같은 내용**을 다시 보냅니다. `Idempotency-Key` 헤더도 사용할 수 있으며 헤더가 본문보다 우선합니다. 정상 응답은 `201`이며 `articles`에 언어별 `id`, `path`, `url`을 반환합니다. 재시도 응답도 같은 글을 가리킵니다.

- `kind`: 일반 글 `article`, ETF `etf`, 입문 강의 `lesson`.
- `slug`: 영문 소문자·숫자·하이픈, 120자 이하. 생략하면 요청 식별자로 자동 생성합니다. 언어가 다른 판본끼리는 같은 주소를 공유합니다.
- `editions`: 한국어 `ko`, 영어 `en` 중 1~2개. 같은 언어를 중복 제출할 수 없습니다.
- `title`: 2~150자. `content`: 제목을 제외한 Markdown 80~200,000자. 원시 HTML과 실행 코드는 표시하지 않습니다.
- `summary`: 500자 이하. 생략하면 본문에서 추출합니다. `seoTitle`: 200자 이하, 생략하면 제목을 사용합니다.
- `author`: 80자 이하. `tags`: 최대 12개, 각 40자 이하.
- `sources`: HTTPS 출처 URL 최대 20개. 본문 아래 참고 자료로 표시됩니다.
- `coverImage`: 선택 항목. HTTPS 이미지 URL 또는 기존 `/learn-assets/`, `/etf-assets/` 이미지 주소. 외부 URL을 사용하는 경우 계속 접근 가능한 이미지를 제공하세요.
- 요청 크기: 1.5MB 이하. 동일 네트워크에서 15분당 20회, 전체 서비스 15분당 200회. 같은 식별자의 성공한 요청 재시도는 새 글 수에 포함되지 않습니다.

`400`은 입력 오류, `403`은 허용하지 않는 브라우저 출처, `409`는 주소/식별자 충돌, `413`은 요청 크기 초과, `415`는 JSON이 아닌 요청, `429`는 요청 제한, `503`은 일시적인 저장소 문제입니다. `503` 이후에는 동일 식별자로 재시도하세요. 두 언어를 함께 보내면 두 판본 모두 저장되거나 모두 실패합니다.

## URL과 검색 반영

- 일반 글: `/articles/{slug}`, `/en/articles/{slug}`
- ETF: `/etf/{slug}`, `/en/etf/{slug}`
- 입문 강의: `/learn/{slug}`, `/en/learn/{slug}`

각 페이지는 서버에서 본문을 렌더링하고 canonical·제목·설명·Article 구조화 데이터를 포함합니다. 실제 존재하는 번역만 hreflang에 연결합니다. `/write`, `/en/write`, API와 다운로드는 검색 노출 대상이 아닙니다. `/sitemap.xml`은 DB에서 발행된 글을 자동으로 읽습니다. Search Console에 이 사이트맵을 제출하면 새 글을 작성할 때마다 사이트맵 자체를 새로 등록할 필요는 없습니다. Google의 수집·색인 여부와 시점은 별도입니다.

## 운영자가 기존 글을 수정할 때

Supabase Space 프로젝트의 `space_publication_documents`에서 `kind`, `slug`, `locale`로 글을 찾습니다. `content`가 Markdown 본문이고 `title`, `summary`, `seo_title`, `tags`, `metadata`가 표시/검색 정보입니다. 수정 시 `updated_at`은 자동 갱신됩니다. `status=draft`로 바꾸면 공개 화면과 사이트맵에서 제외됩니다. 공개 작성 API에는 이 수정 권한이 없습니다.

홈 소개 및 강의/ETF 소개는 `space_publication_settings`의 `home`, `learn`, `etf`에 있습니다. ETF 수입 계산에 사용한 기준 자료는 `etf-income-scenarios`에 보관했습니다. 기준 자료를 변경할 때는 해당 글의 표와 설명도 함께 갱신해야 합니다.

시각 자료는 비공개 Storage 버킷 `space-publication-assets`에 있습니다. 버킷 이름은 서버 환경변수 `SUPABASE_PUBLICATION_BUCKET`으로 변경할 수 있습니다. 기존 경로의 파일을 교체하면 캐시 때문에 최대 1시간 뒤 표시될 수 있습니다. 본문 변경과 새 글은 다음 요청부터 표시됩니다.

## 권한과 보관

브라우저에는 Supabase 비밀 키를 제공하지 않습니다. 데이터베이스 익명 접근은 발행된 글/설정 읽기만 허용하며, 서버가 검증한 새 원고만 전용 DB 함수로 저장합니다. 작성 요청 식별자를 보관하여 중복 발행을 막고, 네트워크 식별자는 서버에서 해시 처리하여 짧은 기간 요청 제한에만 사용합니다. 이력의 원고는 Git에 남아 있으나 현재 운영 원고의 원본은 Supabase입니다. 이전 원고·그림의 별도 백업도 소스 저장소 밖에 보관했습니다.
