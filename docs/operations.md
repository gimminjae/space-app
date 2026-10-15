# 운영 연결 기록

확인일: 2026-10-15 (한국 시간)

| 항목 | 상태 |
| --- | --- |
| Next.js 배포 | Netlify `space-service-io-kr`에 배포 |
| GitHub 저장소 | https://github.com/gimminjae/space-app |
| 자동 배포 | `master` 커밋 → 자동 테스트 → Next.js 빌드 → 운영 배포 |
| 운영 주소 | https://space.service.io.kr 브라우저 HTTPS 접속 확인 |
| DNS | 가비아 CNAME `space` → `space-service-io-kr.netlify.app.` 추가, TTL 600 |
| HTTPS | Netlify 인증서 활성화, HTTPS 강제 사용 |
| Google Search Console | 기존 `service.io.kr` 도메인 속성에 사이트맵 제출, **성공**, 발견 페이지 2개 |
| AdSense | 게시자 연결 및 ads.txt 정상 응답, 상위 사이트 `service.io.kr` 심사 중 |
| Supabase | GPT 계정 `space` 조직 생성, 프로젝트 생성은 사용자 요청으로 보류 |
| S3 | 서버 업로드 구현 완료, 실제 버킷 및 환경변수 입력 필요 |
| 게시글 | 아직 작성·발행한 글 없음 |

기존 DNS 11개는 그대로 두고 space CNAME 하나를 추가했습니다. 기존 다른 Supabase 프로젝트도 변경하지 않았습니다.

## 이어서 할 일

1. GPT 계정의 Supabase `space` 조직에서 프로젝트 생성과 DB 비밀번호 설정을 완료합니다.
2. 동봉한 마이그레이션을 해당 새 프로젝트에 적용하고 URL·publishable key·secret key를 Netlify에 설정합니다.
3. 비공개 S3 버킷과 IAM 자격증명을 준비하고 환경변수를 설정합니다. S3 설정 없이도 텍스트 글은 작성할 수 있습니다.
4. 재배포 후 관리자 비밀번호로 실제 글 작성·수정·공개/비공개·삭제와 첨부파일 접근 권한을 확인합니다.
5. 실제 경제 글을 게시합니다. 사이트맵은 자동 갱신됩니다. AdSense의 사이트 승인과 광고 설정은 계정에서 확인합니다.

세부 설정은 프로젝트 루트의 README.md에 있습니다. 운영 비밀번호는 소스 압축 파일 밖에 별도 전달합니다.

## 검증

- TypeScript 검사와 프로덕션 빌드 통과
- 자동 테스트 5개 통과: 비밀번호, 파일 제한, 입력 검증, 실제 마이그레이션과 권한/글 생명주기, Markdown 정화
- 데스크톱 브라우저에서 운영 주소와 관리 준비 화면 확인
- 브라우저의 화면 크기 변경 기능이 실제 화면에 적용되지 않아 모바일 실화면 검증은 완료하지 못함. 반응형 스타일은 구현되어 있음
- 실제 Supabase와 S3의 글 저장·업로드 시험은 연결 설정 전이라 미실행
- 공개 페이지·검색 메타데이터·사이트맵·RSS·광고 인증·미인증 차단 확인은 `node scripts/smoke.mjs`로 재실행 가능

## 검색과 광고의 남은 상태

Search Console의 사이트맵 성공은 수집 요청 접수 및 사이트맵 읽기 성공을 뜻합니다. 현재 2개 페이지가 발견됐으며 모든 글의 색인 완료를 뜻하지는 않습니다.

AdSense `service.io.kr`의 사이트 소유권은 확인됐고 심사 요청이 접수돼 있습니다. `https://service.io.kr/ads.txt`와 space의 ads.txt는 올바른 게시자 행을 반환합니다. 계정 화면의 ads.txt 상태는 재수집 전까지 과거 결과가 남을 수 있습니다. 승인 여부와 광고 노출 시점은 Google에서 결정합니다.

## 배포 정보

- Netlify 팀: awesomehuman
- Site ID: `4321a8b0-9509-4377-af54-d9cc0f64ede3`
- 프로젝트 관리: https://app.netlify.com/projects/space-service-io-kr
- Supabase 조직: `space` (`mbezxnyynbhojjbiqjrr`)

백업 자동화나 S3 미사용 파일 정리 작업은 별도로 생성하지 않았습니다. README의 데이터 보존 안내를 기준으로 운영 정책을 정하세요.

GitHub 연결 전 CLI 배포 ID: `6ad0d49180368b5cb3a4250e`

운영 점검 15개를 모두 통과했습니다. 로컬 네트워크의 새 도메인 DNS 캐시가 갱신되지 않아 HTTP 자동 검사는 동일한 운영 배포의 Netlify 기본 주소에서 수행했습니다. 전용 도메인의 HTTPS 화면은 Chrome에서, 사이트맵 수집은 Google Search Console에서 확인했습니다. 개별 결과는 `production-checks.json`에 있습니다.

## GitHub 자동 배포

기존 Netlify 프로젝트에 `gimminjae/space-app` 저장소의 `master` 브랜치를 연결했습니다. 빌드 명령은 저장소의 `netlify.toml`에 정의한 `npm test && npm run build`, 게시 디렉터리는 `.next`, Node.js 버전은 22입니다. 실제 배포 결과와 커밋 ID는 Netlify Deploys에서 확인할 수 있습니다.

`.env.local`, 관리자 비밀번호, Netlify 인증 파일, node_modules, 빌드 결과물, Supabase 임시 파일은 Git에서 제외했습니다. 기존 Netlify 환경변수와 도메인 설정을 그대로 사용합니다.
