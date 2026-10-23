# DB에서 카테고리와 메뉴 관리

Supabase의 **Space 프로젝트 → Table Editor → `space_publication_categories`**에서 관리합니다. 저장 후 사이트를 새로고침하면 반영됩니다. 카테고리 이름이나 순서를 바꿀 때 Git 수정, 재배포, 캐시 삭제는 필요하지 않습니다.

## 자주 바꾸는 항목

| 항목 | 용도 |
|---|---|
| `name_ko`, `name_en` | 메뉴, 글 목록, 본문 카테고리, RSS에 표시할 이름 |
| `description_ko`, `description_en` | 카테고리 소개와 검색 설명 |
| `seo_title_ko`, `seo_title_en` | 검색 제목. 비우면 카테고리 이름 사용 |
| `sort_order` | 메뉴 순서. 작은 숫자가 먼저 표시됨 |
| `show_in_header`, `show_in_footer` | 상단·하단 메뉴 노출 여부 |
| `accepts_submissions` | 공개 작성 화면/API에서 새 글을 받을지 여부 |
| `content` | 언어별 긴 제목 `name`, 소개 `introduction`, 안내 `notice`, 발행 일정 문구 `schedule`, 빈 목록 안내 `empty` 등 |

글이 없어도 새 카테고리 주소와 작성 화면은 바로 사용할 수 있습니다. 빈 카테고리는 검색 제외이며, 글이 발행되면 사이트맵과 검색 허용 상태가 자동으로 바뀝니다. 메뉴에서 감추더라도 기존 글과 주소는 유지됩니다.

## 새 카테고리 추가

새 행을 추가하고 `slug`, `name_ko`, `name_en`을 입력합니다. 일반 카테고리는 `kind=article` 기본값을 사용합니다. 예를 들어 `slug=bonds`, 이름 `채권` / `Bonds`로 저장하면 `/category/bonds`와 `/en/category/bonds`가 생깁니다. 작성 화면에 자동으로 나타나고 API에 `category: "bonds"`를 지정할 수 있습니다. 새 글의 주소는 계속 `/articles/{slug}`입니다.

`slug`는 영문 소문자·숫자·하이픈으로 정하는 **고정 주소 키**입니다. 표시 이름은 자유롭게 바꾸되 이미 만든 주소 키, 글 종류, 기본 카테고리 및 거래일 규칙은 바꾸지 않습니다. 이름 변경이 검색 주소 변경이나 자동 발행 중단으로 이어지는 것을 막습니다. 다른 구조가 필요하면 새 카테고리를 만들고 글을 옮깁니다.

`kind=etf` 또는 `lesson`으로 추가하면 해당 글 종류의 작성 선택지에 나타납니다. 기본 입문 강의와 ETF 모음 주소(`/learn`, `/category/etf`)는 그대로 유지됩니다.

## 글의 분류 변경

`space_publication_documents.category_slug`를 새 카테고리의 `slug`로 변경합니다. 한국어·영어 행을 각각 변경하세요. 같은 `kind`의 카테고리로만 이동할 수 있고, 본문·발행일·글 주소는 유지됩니다. 기존 `metadata.category`도 자동으로 동기화됩니다. 글이 연결된 카테고리는 실수로 삭제할 수 없습니다.

## 다른 운영 정보

- `space_publication_settings`의 **`navigation`**: 카테고리 외 메뉴 링크, 한국어·영어 문구, 정렬 순서, 하단 소개 문구. `header`/`footer`에는 `{ "href": "/about", "ko": "소개", "en": "About", "sort_order": 40 }` 형식으로 추가합니다. 내부 사이트 경로만 허용합니다. 카테고리는 이 설정에 중복 등록하지 않고 카테고리 행의 노출 항목으로 관리합니다.
- 같은 테이블의 **`home`**: 홈 제목, 검색 설명, 소개 문구.
- **`space_publication_documents`**: 글과 소개·개인정보 페이지 본문, 검색 제목, 요약, 태그.
- 이전 `learn`, `etf`, 두 브리핑 설정은 전환 전 백업으로 남아 있습니다. **이후 카테고리 소개 수정은 `space_publication_categories`에서 합니다.**

기존 08:30 / 21:30 자동화는 그대로 동작합니다. `content.schedule`은 화면에 표시되는 문구이며 실제 실행 시각을 바꾸지는 않습니다. API의 `GET /api/publish`는 현재 DB에서 발행 가능한 카테고리와 거래일 필요 여부를 반환합니다.

카테고리·메뉴의 변경은 Supabase 프로젝트 접근 권한이 있는 운영자가 수행합니다. 로그인 없이 공개 글을 새로 발행하는 기능은 유지되지만, 공개 이용자가 운영 카테고리를 수정할 수는 없습니다.
