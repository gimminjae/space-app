# Vercel 운영 배포

공개 주소는 `https://space.service.io.kr`입니다. Vercel에서 Next.js 서버를 실행하고 글, 카테고리, 메뉴, 시각 자료는 기존 Space Supabase 프로젝트를 사용합니다. 호스팅 이전으로 글 주소나 자동 발행 주소를 변경하지 않습니다.

## 빌드 설정

- 저장소: `gimminjae/space-app`, 운영 브랜치: `master`
- 프레임워크: Next.js, 루트 디렉터리: 저장소 루트
- Node.js: 22.x, 설치: `npm ci`
- 빌드: `npm test && npm run build`
- 함수 리전: 서울 `icn1`
- 설정 파일: `vercel.json`

Netlify 자동 빌드는 중지합니다. 이전 Netlify 배포는 복구 참고용으로 남기며 새 배포를 진행하지 않습니다.

## 환경변수

운영 환경에만 기존 `.env.local`의 서버 설정을 등록합니다. 필수 값은 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SITE_URL`입니다. `SITE_URL`은 Vercel 임시 주소 대신 공개 주소를 유지합니다. `SITE_AUTHOR`, `ADSENSE_CLIENT_ID`, `ADSENSE_ENABLED`, `AUTH_EMAIL_READY`도 기존 값을 보존합니다.

Supabase 비밀 키는 Secret으로 저장하고 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다. 운영 DB 키를 Preview/Development 환경으로 복사하지 않습니다. 로컬 환경 파일, `.vercel`, `.netlify`, `.secrets`는 업로드하지 않습니다. AdSense는 기존 동의·광고 단위 조건을 그대로 적용합니다.

## 배포와 확인

연결된 팀과 프로젝트를 먼저 확인한 후 운영 배포를 실행합니다. 환경변수 변경은 새 배포부터 적용됩니다. 배포 성공 후 다음을 확인합니다.

```sh
node --env-file=.env.local scripts/check-publication-categories.mjs https://space.service.io.kr
node scripts/check-seo.mjs https://space.service.io.kr /absolute/path/to/seo-report.json
```

첫 검사는 임시 카테고리와 한국어·영어 검증 글을 만들고 정리합니다. 공개 글, 이미지, 작성 화면, DB 수정 즉시 반영, 사이트맵, canonical, 언어 연결을 검증합니다. `publishingClientIp`는 Vercel이 덮어쓰는 `x-forwarded-for`만 사용해 발행 요청을 제한하고 다른 플랫폼용 헤더를 신뢰하지 않습니다.

## 도메인

가비아 DNS의 `space` CNAME만 Vercel이 해당 프로젝트에 제시한 값으로 변경합니다. `service.io.kr`의 네임서버, 루트 주소, 다른 하위 도메인, 메일과 소유권 확인 레코드는 유지합니다. DNS와 HTTPS가 모두 정상인지 확인한 후 이전 완료로 판단합니다. 기존 URL을 유지하므로 Search Console 속성이나 사이트맵 주소를 변경할 필요가 없습니다.
