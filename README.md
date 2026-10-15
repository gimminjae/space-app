# space

Next.js · Supabase · AWS S3 기반 한국어 경제 블로그입니다.

- 운영 주소: https://space.service.io.kr
- 관리 화면: https://space.service.io.kr/admin
- 배포 관리: https://app.netlify.com/projects/space-service-io-kr
- 소스 저장소: https://github.com/gimminjae/space-app (`master` 브랜치)
- 사이트맵: https://space.service.io.kr/sitemap.xml
- RSS: https://space.service.io.kr/feed.xml

## 구현된 기능

방문자 회원가입 없이 글을 읽고 검색할 수 있습니다. 운영자는 공통 관리 비밀번호로 관리 화면을 열고, 저장·수정·삭제·분류 변경 때 비밀번호를 다시 입력합니다. 관리 세션은 30분 동안 유지되며 비밀번호 교체 시 기존 세션이 무효화됩니다.

- 제목, 요약, Markdown 본문, 작성자, 카테고리, 태그, 대표 이미지
- 외부 편집기 `@uiw/react-md-editor`, 표·링크·목록·미리보기
- 공개·비공개 전환, 수정 충돌 감지, 삭제 확인
- 카테고리·태그 관리, 카테고리 삭제 시 글 이동
- 이미지·문서 S3 업로드, 파일당 4MB
- 서버에서 렌더링하는 글별 고유 주소, canonical, 검색 제목·설명, OG 이미지, BlogPosting 구조화 데이터
- 공개 글만 자동으로 포함하는 sitemap.xml·RSS, 관리자·검색 페이지 noindex
- 반응형 화면, 키보드 접근, 목차, 관련 글, 개인정보처리방침

## 현재 연결 상태와 필요한 설정

2026-10-15 기준 Next.js 앱을 Netlify에 배포하고 전용 도메인을 설정했습니다. 실제 운영 연결 상태는 `docs/operations.md`를 참고하세요.

**Supabase 프로젝트 생성은 사용자의 요청으로 보류했습니다.** GPT 브라우저 계정에 `space` 조직까지 만들었으며, 프로젝트 생성·SQL 적용·API 키 설정은 아직입니다. 이 상태에서 공개 화면은 빈 블로그로 표시되고 관리 기능은 잠겨 있습니다. 별도의 기존 Supabase 프로젝트에는 변경을 적용하지 않았습니다.

S3는 환경변수로 활성화하도록 구현했습니다. 버킷·접근 권한·연결값은 아직 제공되지 않아 실제 업로드 검증은 하지 않았습니다. 비공개 버킷과 아래 권한을 준비한 뒤 환경변수를 넣으면 별도의 앱 코드 수정이나 CORS 설정 없이 작동합니다.

## 로컬 실행

Node.js 22를 사용합니다.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

http://127.0.0.1:3000 에서 확인합니다. DB 설정 없이도 공개 화면의 빈 상태를 볼 수 있습니다. 검증 명령은 다음과 같습니다.

```sh
npm run typecheck
npm test
npm run build
```

## Supabase 연결

1. 브라우저 GPT 계정의 `space` 조직에서 새 `space` 프로젝트를 생성합니다. DB 비밀번호는 소유자가 직접 설정하고 별도로 보관합니다.
2. Supabase SQL Editor에서 `supabase/migrations/20261015120706_space_blog.sql` 전체를 새 쿼리로 실행합니다. 또는 CLI로 해당 프로젝트를 연결한 뒤 `supabase db push`를 실행합니다. 동일 SQL을 수동으로 중복 실행하지 마세요.
3. 프로젝트의 API 설정에서 URL, publishable key, secret key를 확보합니다. 기존 방식의 anon key·service_role key도 각각 대응하는 환경변수로 사용할 수 있습니다.
4. 로컬 `.env.local` 및 Netlify의 **Project configuration → Environment variables**에 입력합니다.

| 환경변수 | 값 |
| --- | --- |
| `SUPABASE_URL` | 해당 space 프로젝트 URL |
| `SUPABASE_PUBLISHABLE_KEY` | publishable key 또는 legacy anon key |
| `SUPABASE_SECRET_KEY` | secret key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret key 대신 legacy service_role key를 쓰는 경우만 |

서버에서만 키를 사용합니다. `NEXT_PUBLIC_` 접두사를 붙이지 마세요. 테이블에는 행 단위 보안이 적용되며, 익명 조회로 비공개 글·비공개 글의 태그·첨부파일·비밀번호 시도 기록을 읽을 수 없습니다. 관리자 키는 브라우저에 전달되지 않습니다.

생성된 기본 분류는 경제 기초, 거시경제, 금융·금리, 주식·기업, 부동산, 경제 이슈입니다. 실제 글은 자동 생성하지 않습니다.

## 관리 비밀번호

초기 배포에는 안전한 임의 비밀번호를 설정했습니다. 비밀번호는 소스 ZIP에 포함하지 않고, 프로젝트 밖의 `space-admin-access.txt`에 따로 전달했습니다. Supabase 연결 후 사용할 수 있습니다.

새 비밀번호를 설정하려면 로컬에서 실행합니다. 입력은 터미널에 표시되므로 혼자 사용하는 환경에서 실행하세요.

```sh
npm run admin:password
```

출력된 `ADMIN_PASSWORD_HASH`와 `ADMIN_SESSION_SECRET`을 Netlify 환경변수에 넣고 재배포합니다. 평문 비밀번호를 환경변수나 Git에 보관하지 않습니다. 비밀번호 시도 제한은 DB에서 원자적으로 처리되어 서버 인스턴스가 늘어나도 유지됩니다.

## AWS S3 연결

1. 전용 S3 버킷을 만들고 **Block Public Access를 모두 활성화**합니다. 기본 SSE-S3 암호화를 사용할 수 있습니다. 이 앱은 `AES256` 암호화를 명시합니다.
2. `space/*` 경로에 대한 PutObject, GetObject, DeleteObject 권한이 있는 최소 권한 IAM 자격증명을 사용합니다. 예시 정책은 `docs/s3-iam-policy.json`입니다. `YOUR_BUCKET_NAME`을 실제 버킷 이름으로 바꾸세요.
3. 다음 값을 Netlify 환경변수에 넣고 재배포합니다.

| 환경변수 | 설명 |
| --- | --- |
| `AWS_REGION` | 실제 버킷 리전, 예: ap-northeast-2 |
| `S3_BUCKET` | 버킷 이름 |
| `AWS_ACCESS_KEY_ID` | 전용 IAM 접근 키 ID |
| `AWS_SECRET_ACCESS_KEY` | 전용 IAM 비밀 키 |
| `AWS_SESSION_TOKEN` | 임시 자격증명을 쓰는 경우만 |

파일은 서버를 통해 업로드하므로 브라우저용 S3 CORS나 공개 읽기 권한이 필요하지 않습니다. S3 URL·키 대신 `/media/첨부ID` 주소를 사용합니다. 공개 글에서 실제 참조한 파일만 익명 열람이 가능하며, 글을 비공개로 바꾸거나 삭제하면 이후 파일 요청도 차단됩니다. 이미 방문자가 내려받은 사본까지 회수하지는 않습니다.

JPG, PNG, WebP, GIF, PDF, TXT, CSV, ZIP, DOCX, XLSX, PPTX를 지원합니다. HTML·SVG·실행 파일은 허용하지 않습니다. 4MB 제한은 서버 업로드와 현재 배포 환경의 요청 크기를 고려한 값입니다.

## 검색과 광고

공개 글은 저장 즉시 개별 URL과 사이트맵에 반영됩니다. 비공개·삭제 글은 공개 경로에서 404로 응답하고 목록·사이트맵·RSS에서 제외됩니다. 이미 검색엔진에 수집된 결과가 제거되는 시점은 검색엔진 재수집에 달려 있습니다.

Google Search Console의 기존 `service.io.kr` 도메인 속성은 `space.service.io.kr`도 포함합니다. 사이트맵 제출 결과는 운영 기록을 참고하세요. 개별 글의 실제 색인과 검색 순위는 보장되지 않으며, 글을 게시한 뒤 URL 검사로 확인할 수 있습니다.

확인된 AdSense 게시자 `ca-pub-4493633870090510`을 연결했습니다. `ADSENSE_ENABLED=true`일 때 공개 글 상세 페이지에만 광고 스크립트를 로드합니다. 빈 화면·관리 화면에는 광고를 넣지 않습니다. `service.io.kr`은 계정에서 심사 중이므로 광고 노출은 Google 승인 이후 가능합니다. 유럽 등 동의가 필요한 지역을 대상으로 광고를 운영할 때에는 AdSense의 개인정보 보호 및 메시지에서 해당 동의 메시지를 설정하세요.

`/ads.txt`와 상위 도메인의 `/ads.txt`에는 게시자 인증 행이 있습니다. 선택 환경변수로 `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION`, `CONTACT_EMAIL`, `SITE_AUTHOR`를 지원합니다. 연락처를 입력하면 개인정보처리방침에 반영됩니다.

## 재배포

Netlify가 GitHub의 `gimminjae/space-app` 저장소와 연결되어 있습니다. `master` 브랜치에 커밋을 푸시하면 자동 테스트와 Next.js 프로덕션 빌드를 실행하고, 성공한 결과를 https://space.service.io.kr 에 자동 반영합니다. 빌드 실패 시 이전 정상 배포가 유지됩니다.

```sh
git add .
git commit -m "변경 내용"
git push origin master
```

환경변수는 Netlify에서 관리하며 GitHub에 저장하지 않습니다. 환경변수만 변경했을 때는 Netlify의 Deploys에서 새 배포를 실행합니다. 수동 배포가 필요할 때만 아래 CLI 명령을 사용합니다.

```sh
npx netlify login
npx netlify link --id 4321a8b0-9509-4377-af54-d9cc0f64ede3
npx netlify deploy --prod --context production
```

CLI 배포도 빌드와 Next.js 함수 패키징까지 수행합니다. 환경변수 변경 후에도 재배포해야 합니다. `.env.local`과 관리 비밀번호 파일을 Git·소스 ZIP에 포함하지 마세요.

## 데이터 보존

글 삭제는 `deleted_at`을 기록하는 방식이며 즉시 사이트에서 숨깁니다. 휴지통 복구 UI는 포함하지 않았습니다. 복구가 필요하면 운영자가 해당 글을 확인한 뒤 Supabase에서 `deleted_at`을 비우고 `status='private'`로 되돌려 검토할 수 있습니다.

글 삭제·첨부 제거 시 S3 파일은 자동 영구 삭제하지 않습니다. 작성 도중 업로드하고 저장하지 않은 파일도 비공개로 남을 수 있습니다. 삭제·복원·장기 보관 정책에 맞춰 운영자가 미사용 파일을 점검하세요. DB 등록 실패 시 업로드된 파일 삭제를 시도하며, 실패하면 서버 로그에 첨부 ID를 남깁니다.

Supabase 백업은 선택한 서비스 요금제·설정에 따릅니다. 정기 DB 백업과 S3 버전 관리를 별도로 설정하고 복구를 확인하세요. 이 프로젝트가 자동 백업 작업을 생성하지는 않습니다.

## 검증 범위

TypeScript 검사, 프로덕션 빌드, 5개 자동 테스트를 통과했습니다. 테스트에는 로컬 PostgreSQL 호환 PGlite에서 실제 마이그레이션 적용, 공개·비공개 권한, 동시 수정 충돌, 공개 전환, 태그 노출 제한, 카테고리 이동, 요청 제한, Markdown 정화가 포함됩니다. 이는 실제 운영 Supabase·S3 연결 시험을 대체하지 않습니다.

연결 완료 후 비공개 글 작성 → 첨부 → 공개 → 익명 열람 → 비공개 전환 → 익명 접근 차단 → 삭제 순서로 운영 연결을 최종 확인하세요.
