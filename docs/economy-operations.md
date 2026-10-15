# Space 경제 읽기 기능 운영 메모

작성일: 2026-10-16. 구현 브랜치: `feat/economy-reader-tools`.

## 구현 범위

1. **개인 자료함**: 글 저장, 폴더 생성/변경/삭제, 5,000자 비공개 메모, 제목·메모 검색, 정렬, 커서 목록. 폴더 삭제는 메모를 유지한 채 분류 없음으로 이동한다. 글이 비공개/삭제되어도 다른 회원에게 제목·본문을 노출하지 않는다. 메모 수정은 버전 충돌을 검사한다.
2. **경제 용어 사전**: 검수한 한국어·영어 30개 용어, 약어 검색, 상세·관련 용어·관련 글, 본문 첫 등장 용어의 설명 창. 기존 링크·코드·제목을 건드리지 않고 HTML 정화를 유지한다.
3. **구독과 피드**: 공간·공통 주제 구독, 8개 공통 주제, 글당 최대 3개 선택, 중복 없는 개인 피드, 구독 관리. 기존 공간별 카테고리·태그와 분리한다.
4. **경제지표**: 한국/미국 8개 지표 정의, 원자료 차트/표, 1/3/5년 보기, 금리 하한/상한, 전년동월·직전 관측·%p 구분, 관심 지표 순서. FRED/ECOS 서버 수집기, 재시도·시간제한·작업 잠금·재개 커서·월간 개정 재검사.
5. **경제 일정**: 공식 자료로 확인한 42개 초기 일정, 월간/목록·필터, KST·서머타임·시각 미정 처리, 관심 일정, ICS, 변경 이력과 확인된 발표 결과. 월간 보기 화살표/Home/End 탐색.

모든 UI/오류는 한국어·영어를 지원한다. 신규 개인 화면은 noindex 및 private/no-store이며 개인 자료 화면에 광고 스크립트를 추가하지 않았다.

## 현재 보류 사항과 이유

- **운영 DB 마이그레이션·시드·회원 저장의 실환경 검증**: Space 프로젝트는 `qkhhjhfnuclneuotfrkt`이다. 10월 16일 IAB에서 기존 Supabase 로그인 세션이 만료된 것을 확인했다. Chrome 연결은 응답 시간 초과, Supabase 연결 도구에는 별도 `we-bible` 프로젝트만 존재한다. 새 로그인·권한 승인 없이 해당 DB의 DDL 실행 경로를 확보하지 못했다. 기존 secret key는 REST 데이터 작업용이며 DB 관리 권한으로 간주하지 않는다.
- **운영 배포**: 신규 스키마가 없는 상태에서 이 코드를 운영에 올리면 마이페이지/글 조회가 실패하므로 운영 브랜치에 병합하지 않는다. 데이터베이스 반영 및 실환경 검증 이후 기존 GitHub → Netlify 흐름으로 출시한다.
- **통계 수집 활성화**: `FRED_API_KEY`, `ECOS_API_KEY`가 없다. 키 발급과 약관 동의는 수행하지 않았다. `ECONOMIC_SYNC_ENABLED` 기본값은 false이다. 가짜 관측값을 저장하지 않는다.
- **ECOS 공개 검수**: 4개 후보 계열의 항목/단위를 공식 sample API로 확인했으나 공개 이용 조건 최종 검토가 남아 `approved:false`이다. 승인 시 `content/series.json`을 변경하고 시드를 다시 실행한다. 한국 실업률은 `901Y027 / I61BC / I28B` 계절조정 계열이다.
- **기존 보류**: 일반 회원가입·재설정 이메일의 SMTP/리다이렉트 설정, `AUTH_EMAIL_READY` 활성화, AWS S3 실제 키 설정은 이번 작업에서 변경하지 않았다.

## 적용 순서

1. 기존 GPT Supabase 계정으로 재로그인하여 **Space** 프로젝트인지 확인한다. 연결 도구의 `we-bible`에는 어떤 SQL도 적용하지 않는다.
2. `supabase/migrations/20261015225638_economy_features.sql`을 한 번 적용한다. 이전 마이그레이션이 적용된 DB가 전제이며 한 트랜잭션이다. 동일 파일을 두 번 실행하지 않는다. 관리 CLI를 쓰면 현재 CLI 도움말과 마이그레이션 기록을 먼저 확인한다.
3. `npm run economy -- seed`로 주제·용어·지표·42개 일정을 등록한다. `npm run economy -- reindex`로 기존 글의 용어 연결을 추가한다. 글 내용·공개 상태는 수정하지 않는다.
4. `npm run economy -- status`와 Supabase Advisors로 RLS/권한/인덱스를 확인한다. 이 스키마는 개인 테이블의 본인 RLS, 운영 테이블의 service_role 전용 쓰기, 호출자 권한 RPC를 사용한다.
5. 로컬 서버를 실제 Space 환경으로 실행하고 `node scripts/economy-live-check.mjs http://127.0.0.1:3000`을 실행한다. 배포용 서버의 허용 출처와 다르면 `SPACE_CHECK_ORIGIN`을 해당 `SITE_URL`로 설정한다. 스크립트는 두 임시 인증 계정을 만들고 자신의 자료만 검증한 뒤 계정과 연결 데이터를 정리한다. 화면에서 로그인 후 저장/메모/구독/관심 지표·일정, 언어 전환 확인도 수행한다.
6. 키와 계열 검수가 준비되면 서버 환경에 키를 넣고 `npm run economy -- backfill`, `npm run economy -- calendar`로 최초 수집/검토를 수행한다. 직접 공식 값과 대조한 뒤 Netlify Functions 환경에도 같은 키를 설정하고 `ECONOMIC_SYNC_ENABLED=true`로 활성화한다. 키는 클라이언트 환경·Git·로그에 넣지 않는다.
7. `npm test`, `npm run typecheck`, `npm run build` 통과 후 브랜치를 운영 브랜치에 병합한다. 기존 Netlify 사이트 `4321a8b0-9509-4377-af54-d9cc0f64ede3`의 GitHub 연동 배포를 확인한다. 새 배포에서 회원 저장/공개 전환·사이트맵·양 언어를 확인한다.

## 수집 및 편집 운영

- `server/economy/`는 Node 서버·운영 스크립트 전용이다. Next.js 서버 조회 코드는 기존 `src/lib/server/` 경계를 사용하며 브라우저가 Supabase/FRED/ECOS 비밀키에 접근하지 않는다.
- `netlify/functions/economic-fred.mts`, `economic-ecos.mts`는 매시간, `economic-calendar.mts`는 6시간 간격이다. 비활성 상태에서는 외부 호출과 DB 작업을 하지 않는다. Netlify 예약 함수는 공개 URL로 직접 호출할 수 없다.
- 관측값 키는 `(series_id, period)`이다. 제공기관의 결측은 null, 0은 0으로 보관한다. 오류/빈 응답/잘못된 단위/잘린 응답은 기존 자료를 덮어쓰지 않는다.
- 최대 20초 작업 예산과 별도 1.5초 커서 저장 예산을 둔다. 작업 잠금은 45초 후 만료한다. HTTP 429 Retry-After가 예산보다 길면 즉시 종료하여 다음 예약 실행으로 넘긴다.
- 최초 적재/월간 재검토는 연도별 범위로 나누어 최근 자료부터 수집한다. 5년 차트의 비교 기준을 위해 최대 6년을 보관한다. 월간 재검토가 끝나면 최근 1년을 갱신한다. `backfill` 명령은 최대 7회 처리하며 남은 커서는 `status`로 확인한다.
- `content/events.json`은 공식 검수 일정이다. 일정 변경 시 **id/provider_key는 유지**하고 `reviewed_at`과 `updated_at`을 새 시각으로 변경한 뒤 시드를 실행한다. 날짜/상태 변경 시 이전 값을 history로 남긴다. 과거 검수 파일 재실행은 최신 일정을 되돌리지 않는다.
- FRED release dates는 날짜만 제공하며 고정 이벤트 ID와 대상 기간이 부족하다. 날짜 변경을 새 일정으로 오인하지 않도록 자동 검사는 미등록 날짜를 `space_sync_runs.cursor.candidates`에 검토 목록으로 남긴다. 운영자가 BLS 등 공식 발표 표에서 대상 기간·시각을 대조하고 기존 안정 ID를 수정한다. 수동 검수 일정은 자동 데이터가 덮어쓰지 않는다.
- 결과 자동 연결은 대상 월이 확정된 CPI·고용 계열에 한정한다. 금리 결정의 실제 효력일과 GDP 추정 차수는 추정해서 붙이지 않는다. 결과는 수집 시점 사본이며 최초 발표값으로 단정하지 않는다. 이후 원자료 개정은 관측값에만 반영하고 이미 수집한 결과 사본은 보존한다.
- 다운로드한 ICS는 자동 구독이 아니다. 일정 변경 후 다시 다운로드해야 한다. 날짜만 있는 항목은 현지 날짜의 종일 일정으로 만든다.
- 지표 화면은 관측일과 수집일을 구분한다. 성공 후 두 시간 이상 경과하면 갱신 지연으로 표시한다. 제공기관이 비활성/미승인이면 연결 준비 상태를 표시한다.

## 계획에서 구체화한 구현 결정

- 초기 30개 용어의 번역·별칭·관련 용어는 단일 레코드 JSON/배열로 묶었다. 언어별 편집·검수의 독립 운영이 필요해질 때 정규화 테이블로 분리할 수 있다.
- 일정 연결 지표는 소규모 배열이며 시드 검증에서 참조를 검사한다.
- 새 차트 라이브러리 없이 SVG 선 그래프와 같은 데이터의 접근 가능한 원자료 표를 구현했다. 결측 구간은 선을 끊고 금리 범위의 상·하한을 구분한다.
- 신규 API는 `/api/[...economy]` 안에서 경로와 메서드를 엄격히 분기한다. 기존 구체 경로의 API에는 영향을 주지 않는다.

## 공식 자료

- [FRED API와 관측값](https://fred.stlouisfed.org/docs/api/fred/series_observations.html), [발표 날짜 API](https://fred.stlouisfed.org/docs/api/fred/release_dates.html), [이용 조건](https://fred.stlouisfed.org/docs/api/terms_of_use.html).
- [한국은행 ECOS](https://ecos.bok.or.kr/api/), [한국은행 결정회의 일정](https://www.bok.or.kr/portal/singl/crncyPolicyDrcMtg/listYear.do?menuNo=200755&mtgSe=A).
- [FOMC 일정](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm), [BLS CPI 일정](https://www.bls.gov/schedule/news_release/cpi.htm), [BLS 고용 일정](https://www.bls.gov/schedule/news_release/empsit.htm), [BEA 일정](https://www.bea.gov/news/schedule).
- [Netlify 예약 함수 실행 제약](https://docs.netlify.com/build/functions/scheduled-functions/).

원자료와 일정을 2026-10-16에 확인했다. 이 문서는 실시간 일정 변경이나 실제 검색 색인을 보장하지 않는다.
