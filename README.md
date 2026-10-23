# space

한국어·영어 경제 입문 강의와 ETF 콘텐츠를 제공하는 Next.js / Supabase 사이트입니다.

- 사이트: https://space.service.io.kr
- 공개 작성 페이지: https://space.service.io.kr/write
- 영문 작성 페이지: https://space.service.io.kr/en/write
- 자동 발행 API: `POST https://space.service.io.kr/api/publish`
- 사이트맵: https://space.service.io.kr/sitemap.xml
- 운영 소스: `gimminjae/space-app`, `master` → Netlify

## 콘텐츠 관리

카테고리 이름·설명·노출·순서는 `space_publication_categories`, 일반 메뉴·하단 소개는 `space_publication_settings.navigation`에서 관리합니다. 저장 후 새로고침하면 반영됩니다. [DB 관리 안내](docs/category-management.md)를 참고하세요.

본문과 검색 메타데이터는 `space_publication_documents`, 홈 소개는 `space_publication_settings`, 강의·ETF·브리핑 소개는 `space_publication_categories`에 보관합니다. 원고를 Git에 넣거나 발행 때마다 빌드할 필요가 없습니다. 시각 자료는 비공개 Supabase Storage 버킷에서 서버가 제공하며 기존 이미지 주소를 유지합니다.

2026-10-23 이전 대상은 글 54개(입문 강의 20개, ETF 34개), 소개·개인정보 페이지 4개, 시각 자료 72개입니다. 기존 `/learn/*`, `/etf/*`, `/about`, `/privacy` 및 영어판 주소를 유지합니다. 새 일반 아티클은 `/articles/{slug}`에 발행됩니다.

로그인·회원가입·개인 서비스 경로는 현재 비활성화되어 있습니다. 기존 회원 데이터와 구현은 보존합니다. 공개 작성은 로그인 없이 **즉시 발행**하며 기존 글 수정·삭제 권한을 제공하지 않습니다. 자세한 형식과 운영 절차는 [자동 발행 안내](docs/publication-automation.md)를 확인하세요. 기존 회원 플랫폼의 기록은 [별도 문서](docs/legacy-member-platform.md)에 있습니다.

## 실행과 확인

Node.js 22 이상을 사용합니다. `.env.example`을 참고해 `.env.local`을 설정합니다. Supabase URL, 공개 읽기 키, 서버 전용 비밀 키가 필요합니다. 비밀 키에 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm start
```

DB 연결 없이 원고를 대신 보여주는 정적 fallback은 없습니다. 데이터베이스 접근에 실패하면 오류로 드러나며 잘못된 빈 사이트맵을 반환하지 않습니다.

실제 배포 검증은 다음을 사용합니다. 두 번째 검사는 임시 검증 글을 발행하고 자신이 만든 글만 정리합니다.

```sh
node scripts/check-seo.mjs https://space.service.io.kr
node --env-file=.env.local scripts/check-publications.mjs https://space.service.io.kr
```

DB 스키마는 `supabase/migrations/20261023043918_publication_content_store.sql`에 있습니다. 원고·이미지 내보내기는 소스 저장소 밖에서 보관합니다. 외부 내보내기 폴더가 있으면 다음으로 복원/검증할 수 있습니다.

```sh
npm run content:import -- /absolute/path/to/export
node --env-file=.env.local scripts/check-publications.mjs http://127.0.0.1:3000 /absolute/path/to/export
```

내보내기 폴더에는 `documents.json`, `settings.json`, `assets/learn-assets/`, `assets/etf-assets/`가 필요합니다. 가져오기는 기존 글을 덮어쓰지 않습니다. 수정은 Supabase에서 수행하고, 새 원고 작성은 공개 작성 페이지/API를 사용합니다.
