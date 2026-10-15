# space

Next.js · Supabase · AWS S3 기반 한국어 경제 블로그입니다.

- 운영 주소: https://space.service.io.kr
- 관리 화면: https://space.service.io.kr/admin
- 배포 관리: https://app.netlify.com/projects/space-service-io-kr
- 소스 저장소: https://github.com/gimminjae/space-app (`master` 브랜치)
- 사이트맵: https://space.service.io.kr/sitemap.xml
- RSS: https://space.service.io.kr/feed.xml

## 구현된 기능

공개 글은 로그인 없이 읽을 수 있습니다. 회원은 이메일·비밀번호로 로그인한 후 자기 공간을 만들고 자신의 글만 등록·수정·삭제합니다. 기존 공통 관리 비밀번호 방식은 폐기했습니다.

- 회원별 고유 주소 `/s/공간주소`, 공간 이름·소개·대표 색상
- 이메일 가입·로그인·로그아웃·비밀번호 재설정, 서버 전용 HttpOnly 인증 쿠키
- 회원마다 기본 카테고리 6개 생성, 개인 카테고리·태그 관리
- 공개 글 주소 `/s/공간주소/posts/글주소`, 서로 다른 공간에서 같은 글 주소 사용 가능
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

Supabase `space` 프로젝트(`qkhhjhfnuclneuotfrkt`, 도쿄)를 생성하고 세 마이그레이션을 실제 적용했습니다. 로컬 앱에서 실제 Supabase 계정 두 개로 로그인·회원 공간·글 등록/수정/삭제·권한 분리를 확인했습니다. 검사에 쓴 계정과 글은 모두 정리했습니다.

**일반 회원가입과 비밀번호 재설정 메일은 아직 준비 중입니다.** 사용자가 추가 승인이 필요한 작업은 미루도록 요청해, 인증 Redirect URL 허용 등록은 저장 직전으로 보류했습니다. SMTP 발송 계정도 필요합니다. 설정을 완료한 뒤 `AUTH_EMAIL_READY=true`로 변경해 재배포하면 가입·재설정 폼이 활성화됩니다. 기존 인증된 계정의 로그인과 글 관리는 이 설정과 독립적으로 작동합니다.
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

현재 운영 프로젝트의 데이터 구조는 적용되어 있습니다. 새 환경을 구성할 때만 `supabase/migrations/`의 파일을 시간순으로 적용하세요. 기존 운영 데이터베이스에 초기 마이그레이션을 다시 실행하지 마세요.

| 환경변수 | 용도 |
| --- | --- |
| `SUPABASE_URL` | space 프로젝트 URL |
| `SUPABASE_PUBLISHABLE_KEY` | 공개 조회 및 회원 세션 클라이언트의 publishable key |
| `SUPABASE_SECRET_KEY` | 첨부파일 메타데이터 등 서버 전용 작업의 secret key |
| `AUTH_EMAIL_READY` | SMTP·Redirect URL 준비 후 `true`, 현재 `false` |

서버에서만 SDK와 연결 설정을 사용합니다. `NEXT_PUBLIC_` 접두사를 붙이지 마세요. 회원의 조회·변경은 해당 회원 JWT로 수행하며, `auth.uid()` 기반 RLS가 직접 API 접근에도 적용됩니다. 비공개 글과 해당 글만 사용하는 태그는 타 회원 및 익명 사용자에게 노출되지 않습니다. 카테고리·태그·첨부파일을 다른 공간의 글과 연결할 수 없도록 복합 외래키도 적용했습니다. 첨부파일 저장 경로를 회원이 임의로 조작할 수 없도록 파일 메타데이터 쓰기는 서버에서만 처리합니다.

## 인증 메일 연결을 마무리하는 방법

1. Supabase Authentication → URL Configuration의 Site URL은 `https://space.service.io.kr`로 설정했습니다.
2. Redirect URLs에 아래 두 주소를 허용합니다. 브라우저에서 **Save URLs** 직전으로 준비해 두었으며, 새로운 인증 접근 허용은 사용자 확인 후 진행합니다.
   - `https://space.service.io.kr/auth/callback`
   - `https://space.service.io.kr/auth/callback?next=/account/password`
3. Authentication → Emails → SMTP Settings에 사용할 발송 서비스의 host, port, username, password, 발신 이메일, 발신자 이름을 입력합니다. 비밀번호·키는 Git이나 채팅에 남기지 않습니다.
4. 발송 서비스가 요구하는 발신 도메인 인증을 완료하고, 본인 이메일로 가입 인증 및 비밀번호 재설정 메일 수신을 확인합니다.
5. Netlify `AUTH_EMAIL_READY=true`로 설정하고 재배포합니다.

Supabase 기본 메일 서버는 프로젝트 팀에 속한 주소에만 보낼 수 있으므로 일반 회원가입에 사용할 수 없습니다. [공식 SMTP 안내](https://supabase.com/docs/guides/auth/auth-smtp)를 참고하세요. 이메일 인증을 끄거나 기존 공통 비밀번호로 우회하지 않습니다.

이메일 인증 링크는 기본 템플릿의 PKCE 흐름을 지원합니다. 링크를 가입을 시작한 브라우저에서 열어야 합니다. 커스텀 템플릿을 사용할 경우 다른 브라우저에서도 인증할 수 있도록 `/auth/confirm?token_hash={{ .TokenHash }}&type=email` 및 재설정용 `type=recovery`도 구현되어 있습니다.

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

CLI 배포도 빌드와 Next.js 함수 패키징까지 수행합니다. 환경변수 변경 후에도 재배포해야 합니다. `.env.local`과 서비스 자격증명을 Git·소스 ZIP에 포함하지 마세요.

## 데이터 보존

글 삭제는 `deleted_at`을 기록하는 방식이며 즉시 사이트에서 숨깁니다. 휴지통 복구 UI는 포함하지 않았습니다. 복구가 필요하면 운영자가 해당 글을 확인한 뒤 Supabase에서 `deleted_at`을 비우고 `status='private'`로 되돌려 검토할 수 있습니다.

글 삭제·첨부 제거 시 S3 파일은 자동 영구 삭제하지 않습니다. 파일 업로드 전 글을 먼저 저장해야 합니다. 업로드 후 본문에 반영하지 않은 파일은 비공개로 남을 수 있습니다. 삭제·복원·장기 보관 정책에 맞춰 운영자가 미사용 파일을 점검하세요. DB 등록 실패 시 업로드된 파일 삭제를 시도하며, 실패하면 서버 로그에 첨부 ID를 남깁니다.

Supabase 백업은 선택한 서비스 요금제·설정에 따릅니다. 정기 DB 백업과 S3 버전 관리를 별도로 설정하고 복구를 확인하세요. 이 프로젝트가 자동 백업 작업을 생성하지는 않습니다.

## 검증 범위

TypeScript 검사, 프로덕션 빌드, 5개 자동 테스트를 통과했습니다. PostgreSQL 호환 PGlite에서 실제 마이그레이션을 적용해 공개·비공개 권한, 회원 간 접근 차단, 외래키, 동시 수정 충돌, 분류 이동, Markdown 정화를 검사합니다.

`node --env-file=.env.local scripts/live-check.mjs`는 실제 Supabase에 임시 계정 두 개를 만들어 45개 항목(HTTPS 운영 환경에서는 Secure 쿠키 2개 검사를 더해 47개)을 확인하고 계정 및 공간을 정리합니다. 로그인·HttpOnly 쿠키·온보딩·글 작성/수정/공개전환/삭제·검색 메타데이터·사이트맵·RSS·교차 회원 접근 차단·인증 토큰을 통한 비밀번호 변경, 인증 주소의 토큰 제거를 포함합니다. 메일 수신과 실제 S3 업로드는 해당 서비스 설정 후 별도로 검증해야 합니다. 결과는 `docs/live-checks.json`에 있습니다.

운영 HTTP 점검은 `node scripts/smoke.mjs`로 재실행합니다. Netlify 별칭을 사용할 경우 두 번째 인자로 `https://space.service.io.kr`을 지정합니다.
