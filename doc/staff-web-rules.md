# Staff Web Rules

이 문서는 `apps/staff-web`에서 앞으로 지켜야 할 리팩토링/구조/구현 규칙을 정리합니다.

작성 기준: 2026-06-26

## 1. 공통 원칙

- 현재 코드가 문서의 기준입니다.
- 추상화는 “예쁘게 보이는가”가 아니라 “변경 비용을 실제로 줄이는가”로 판단합니다.
- 병의원/의료진처럼 이미 반복되는 패턴이 있는 화면은 먼저 기존 패턴을 재사용합니다.
- 새 구조를 만들기 전에 기존 `hospital`, `doctor`, `common`의 위치와 역할을 먼저 봅니다.

## 2. 폴더 규칙

### 2.0 `app/(admin)/(pages)` 기준

페이지 route group은 아래 3개만 씁니다.

- `(common)`
- `(hospital)`
- `(beauty)`

기능명 기준 route group `(wallet)`, `(ads)`, `(posts)`처럼 잘게 쪼개지 않습니다.
공통 메뉴에 해당하는 page는 `(pages)/(common)` 아래에 둡니다.
`/profile` 같은 관리자 공통 페이지도 `(pages)/(common)` 아래에 둡니다.
병의원 도메인 게시물 page는 `(pages)/(hospital)` 아래에 둡니다.
성형후기/시술후기/병의원 평가는 URL 세그먼트도 `/reviews/*`를 사용하고, `(common)/posts`에는 두지 않습니다.

### 2.1 `common`의 의미

`apps/staff-web`에서 `common`은 “staff 관리자 앱 전체 공통”을 뜻합니다.

즉:

- 다른 actor 앱 공통일 필요는 없습니다.
- 하지만 병의원/의료진 같은 특정 도메인 필드명에 묶이면 `common`이 아닙니다.

### 2.2 `common`은 평면으로 쌓지 않는다

`lib/common` 아래에 파일이 늘어나면 책임별 하위 폴더를 만듭니다.

현재 기준:

- `auth/`
- `routing/`
- `navigation/`

새 파일도 같은 방식으로 넣습니다.

### 2.3 도메인 경계

아래는 도메인 폴더에 둡니다.

- 병의원 주소/특징/사업자정보 전용 로직
- 공지사항 본문 에디터/첨부파일/게시설정 전용 로직
- 의료진 병의원 검색/프로필/증빙 로직
- 동영상 목록/등록/상세/수정 전용 로직
- 토크 목록 전용 로직
- 토크 상세/댓글 목록/댓글 멘션 전용 로직
- 성형후기/시술후기 게시글/댓글 목록 전용 로직
- 병의원/공지사항/의료진 `form.ts`, `list.ts`
- 동영상 `form.ts`, `list.ts`
- 토크 `list.ts`
- 토크 댓글 `comment-list.ts`, 상세 `detail.ts`
- 병의원 후기 `list.ts`, 댓글 `comment-list.ts`
- 도메인 field name을 아는 validation / error mapping / focus mapping

## 3. 컴포넌트 분리 규칙

### 3.1 섹션 단위까지만 분리

병의원/공지사항/의료진 폼은 섹션 단위까지만 분리합니다.

현재 기준:

- 병의원 폼
  - 기본정보
  - 사업자정보
  - 미디어
- 공지사항 폼
  - 기본정보
  - 내용
  - 첨부파일
- 의료진 폼
  - 기본정보
  - 시술분야
  - 의사정보

폼이 아닌 독립 목록 기능은 `toolbar / filter / table` 정도까지만 분리합니다.

예:

- 동영상 목록
  - toolbar
  - filter
  - table
- 토크 목록
  - toolbar
  - filter
  - table
- 해시태그 목록
  - toolbar
  - table
  - modal
- 동영상 폼
  - 기본정보
  - 카테고리
  - 배포정보
  - 파일업로드

### 3.2 아래 경우에만 추가 분리

- 비동기 로직이 독립적으로 존재한다.
- 상태가 부모와 별개로 유지된다.
- 두 군데 이상에서 실제로 재사용된다.

이 조건이 아니면 섹션 파일 안 private helper로 둡니다.

### 3.3 금지

- `OptionButtonGroup`, `RepeaterField` 같은 작은 도메인 전용 조각을 습관적으로 파일 분리하지 않습니다.
- “언젠가 재사용할 수도 있음”만으로 컴포넌트를 뽑지 않습니다.

## 4. 훅 규칙

### 4.1 `hooks/common`

아래 조건을 모두 만족해야 합니다.

- 도메인 이름 없이 설명 가능
- 병의원/의료진 둘 다 사용할 수 있음
- endpoint나 field name에 직접 묶이지 않음

예:

- `useCategorySelectorLoader`
- `useDaumPostcode`
- `useFormFieldFocus`

### 4.2 도메인 훅

아래는 도메인 훅으로 둡니다.

- `hospital_id`, `feature_ids`, `business_address`처럼 특정 field를 직접 아는 훅
- 특정 endpoint만 호출하는 훅
- 특정 DOM target selector를 아는 훅

예:

- `useHospitalAddressSearch`
- `useHospitalFeatureList`
- `useNoticeFieldFocus`
- `useNoticeEditorTempImages`
- `useDoctorHospitalOptions`
- `useHospitalFieldFocus`
- `useDoctorFieldFocus`
- `useVideoHospitalOptions`
- `useVideoDoctorOptions`
- `useVideoFieldFocus`

### 4.3 훅이 아닌 것은 `lib`

상태가 없고 side effect가 없으면 훅으로 만들지 않습니다.

예:

- 복귀 경로 조립
- query string builder
- mapper
- formatter

이런 것은 `lib`로 둡니다.

## 5. `lib` 규칙

### 5.1 `lib/common`

다음만 둡니다.

- API client
- auth/session
- routing definition
- navigation helper
- 공통 normalize/helper

### 5.2 `lib/hospital`, `lib/hospital-review`, `lib/notice`, `lib/doctor`, `lib/video`, `lib/hashtag`, `lib/talk`

다음만 둡니다.

- form 기본값
- option 상수
- 타입
- 검증
- error mapping
- detail/list mapper
- query builder

페이지 상태 자체는 `lib`로 빼지 않습니다.
해시태그처럼 단일 필드 관리자 CRUD는 `list.ts` 하나에 URL state, row mapper, 입력 sanitize/validate를 같이 둘 수 있습니다.
토크처럼 병의원 게시물 하위의 독립 목록도 `list.ts` 하나에 URL state, row mapper, query helper를 같이 둘 수 있습니다.
토크 댓글 목록은 `lib/talk/comment-list.ts`, 토크 상세 mapper는 `lib/talk/detail.ts`에 둡니다.
병의원 후기 게시글 목록은 `lib/hospital-review/list.ts`, 댓글 목록은 `lib/hospital-review/comment-list.ts`에 둡니다.

## 6. 목록 페이지 규칙

병의원/공지사항/의료진/동영상/토크/병의원 후기 목록은 같은 패턴을 지킵니다.

- 검색/필터/정렬/페이지/per_page는 URL과 동기화합니다.
- 새로고침 후에도 현재 목록 문맥이 복원되어야 합니다.
- 상세 진입 시 `returnTo`를 유지합니다.
- 등록/수정 후 복귀 시 `highlight`로 해당 행을 강조합니다.
- 행 클릭 전환은 `router.prefetch()`를 같이 씁니다.
- 게시글/댓글 탭이 한 화면에 있으면 탭별 필터 상태를 공유하지 않습니다.
- 탭 전환 시 필터와 선택 row 상태는 초기화합니다.
- 댓글 목록의 카테고리는 댓글 자체가 아니라 부모 게시글 카테고리 기준으로 필터링합니다.

### 6.1 목록 상태 책임

목록 페이지는 아래 책임을 섞지 않습니다.

- `*TableClient.tsx`: URL state, fetch orchestration, page action, row 선택 상태를 소유합니다.
- `components/{domain}/list/*FilterPanel.tsx`: draft filter UI와 입력값 변경만 담당합니다.
- `components/{domain}/list/*DataTable.tsx`: row 렌더링, 정렬 클릭, 행 액션만 담당합니다.
- `lib/{domain}/list.ts`: query parse/build, row mapper, formatter, option 상수만 담당합니다.

`FilterPanel`과 `DataTable`에서는 API 호출, router 이동 정책, 서버 응답 파싱을 하지 않습니다.

### 6.2 목록 공통 훅 기준

아래 패턴이 2개 이상 목록에서 반복되면 공통 훅 후보입니다.

- `requestKeyRef`
- `hasFetchedRef`
- `loading / refreshing / error / meta / rows`
- URL query 동기화
- latest request key 처리
- 수동 새로고침 처리

단, 도메인별 query field와 row mapper는 공통 훅 안에 넣지 않습니다.
공통 훅은 fetch life cycle만 담당하고, query builder와 mapper는 각 도메인 `lib/{domain}/list.ts`에 둡니다.

### 6.3 목록 성능 기준

- 목록 데이터 응답을 받은 뒤 이미지를 기다리느라 table 렌더링을 지연하지 않습니다.
- 이미지 preload는 필수 UX가 아니면 `await`하지 않습니다.
- 요약 카드 API와 목록 API는 서로 의존하지 않으면 병렬로 요청합니다.
- 필터 option API는 같은 화면에서 반복 호출하지 않도록 캐시 또는 부모 상태를 우선 검토합니다.
- 검색 입력은 draft와 applied keyword를 분리합니다. 입력할 때마다 목록 API를 호출하지 않습니다.
- URL query 동기화는 필요한 경우에만 `router.replace`를 호출합니다.
- 첫 로딩 이후 같은 query의 중복 fetch는 막되, 수동 새로고침은 항상 허용합니다.
- row image는 가능한 한 브라우저 lazy loading과 고정 크기 placeholder로 처리합니다.

## 7. 등록/수정 폼 규칙

- `page.tsx`는 metadata, params 전달, Client 렌더만 담당합니다.
- `*Client.tsx`가 fetch, submit orchestration, redirect, header action, error state를 소유합니다.
- 섹션 컴포넌트는 렌더링 중심으로 유지합니다.
- 첫 번째 유효성 에러 필드로 스크롤 + 포커스를 보냅니다.
- 성공 후에는 목록으로 복귀하고 문맥을 유지합니다.
- create와 edit의 UI/업로더 경험은 가능한 한 같게 맞춥니다.
- 공지사항 폼도 섹션 단위만 분리합니다.
- 현재 기준 섹션은 `메인 정보(기본정보+내용) / 첨부파일`입니다.
- 동영상 폼도 섹션 단위만 분리합니다.
- 현재 기준 섹션은 `기본정보 / 카테고리 / 배포정보 / 파일업로드`입니다.
- 병의원 `병의원정보(feature_ids)`는 create/edit 모두 최소 1개 이상 필수입니다.
- `show`와 `update` 권한이 분리된 리소스는 상세와 수정을 같은 route에 섞지 않습니다.
- 이 경우 상세는 `/[id]`, 수정은 `/[id]/edit`로 분리합니다.
- 수정 페이지 데이터는 상세 GET 하나로만 불러오고, 별도 `/edit` GET endpoint는 만들지 않습니다.
- 수정 폼에서 계층형 카테고리의 기존 선택값이 있으면, selector에 `selectedItems`를 함께 넘겨서 선택 chip과 체크 상태를 복원합니다.

### 7.1 폼 파일 책임 분리

폼은 역할 기준으로 분리합니다.

| 위치 | 책임 | 금지 |
| --- | --- | --- |
| `app/**/page.tsx` | metadata, params 전달, Client 렌더 | 상태, API, validation |
| `*CreateFormClient.tsx`, `*EditFormClient.tsx` | 화면 흐름 조립, 초기 로드, submit 호출, 성공 후 이동, header action 연결 | 도메인 순수 로직 장문 구현 |
| `lib/{domain}/form.ts` | 타입, 초기값, validation, normalize, payload/FormData builder, 서버 응답 -> form 변환 | React state, API 호출, router, modal |
| `components/{domain}/form/*Section.tsx` | 섹션 UI 렌더링 | API 호출, submit, 라우팅, 서버 응답 파싱 |
| `hooks/{domain}/use*FormState.ts` | 복잡한 form state 묶음 | API submit |
| `hooks/{domain}/use*Submit.ts` | validation 실행, payload 생성, API 호출, submitting 상태 | 성공 후 page 이동 정책 |

`*Client.tsx`가 500줄을 넘기면 아래 중 하나를 우선 분리합니다.

- form state hook
- submit hook
- media state hook
- section component
- domain pure helper

줄 수만 줄이기 위한 분리는 금지합니다. 책임이 분명할 때만 분리합니다.

### 7.2 Form State 규칙

- form 값은 하나의 `form` object를 기본으로 둡니다.
- file, existing media, selected category item처럼 form field가 아닌 UI 보조 상태는 별도 state로 둡니다.
- create/edit이 같은 필드를 쓰면 동일한 `HospitalFormValues` 같은 타입을 공유합니다.
- 서버 응답을 그대로 state로 들고 다니지 않습니다. 필요한 form shape로 변환해서 저장합니다.
- 기존값 비교가 필요하면 `initialForm`, `initialMediaId`, `initialOrder`처럼 비교 대상만 명시적으로 보관합니다.
- field 변경 함수는 `onFieldChange(field, value)` 형태를 우선 사용합니다.
- 복잡한 상태 업데이트는 Client 안에 흩뿌리지 말고 domain hook이나 pure helper로 옮깁니다.

### 7.3 API Submit 규칙

- submit 함수는 `validate -> payload build -> api call -> result handling` 순서를 지킵니다.
- payload/FormData 생성은 가능한 한 `lib/{domain}/form.ts` pure helper에 둡니다.
- `*FormClient.tsx`에서는 `new FormData()`를 직접 만들지 않고 `buildCreate*FormData`, `buildUpdate*FormData` 같은 도메인 빌더를 호출합니다.
- API 함수가 2군데 이상에서 쓰이면 `lib/{domain}/api.ts`로 분리합니다.
- section component에서는 API를 직접 호출하지 않습니다.
- submit hook을 만들더라도 성공 후 `router.push/replace`는 Client가 결정합니다.
- `isSubmitting`은 중복 클릭 방지와 버튼 disabled에 반드시 연결합니다.
- 서버 validation error가 field 기준으로 내려오면 form error shape로 변환합니다.
- 성공 후 목록 복귀는 `returnTo`와 `highlight` 규칙을 지킵니다.

### 7.4 Validation 규칙

- validation은 side effect 없는 pure function이어야 합니다.
- validation 함수 안에서 API, router, DOM, alert, modal을 사용하지 않습니다.
- error key는 실제 form field key와 일치시킵니다.
- field focus 순서는 `FIELD_FOCUS_ORDER` 같은 명시적 배열로 관리합니다.
- UI 컴포넌트에서 필수 문구를 임의로 만들지 않습니다.
- create/update validation이 다르면 `validateCreate*`, `validateUpdate*`로 분리합니다.
- message는 domain validation에 두고, section UI는 받은 error를 표시만 합니다.
- 최소/최대 개수, 파일 조건, 날짜 순서처럼 서버와 맞아야 하는 규칙은 백엔드와 이름/조건을 맞춥니다.

### 7.5 Media 규칙

- 파일 검증 규칙과 검증 메시지는 UI 컴포넌트가 아니라 `lib/{domain}/form.ts` 또는 domain media helper에 둡니다.
- `profileImage`, `existingMedia`, preview modal, upload modal처럼 form field가 아닌 미디어 UI 상태는 create/edit에 반복되면 `hooks/{domain}/use*MediaState.ts`로 묶습니다.
- `useObjectUrl`, 이미지 타입 판별, 파일 용량/확장자 검증은 공통화합니다.
- 각 폼 파일에 `URL.createObjectURL` helper를 반복해서 만들지 않습니다.
- 도메인별 차이는 rule object로 표현합니다.
- 예: 로고 1:1, 프로필 1:1, 이벤트 썸네일 규격처럼 정책만 도메인에 둡니다.
- 기존 미디어와 신규 파일을 함께 다루는 UI는 `existing`, `new`, `order`, `main` 상태를 명확히 분리합니다.
- 원본보기/미리보기/다운로드 문구는 도메인별로 임의 변경하지 않고 공통 용어를 우선 사용합니다.

### 7.6 Section UI 규칙

섹션 컴포넌트는 가능한 한 아래 props만 받습니다.

- `value` 또는 `form`
- `error` 또는 `errors`
- `disabled`
- `onChange`
- `onPreview`
- `options`

섹션 컴포넌트가 받으면 안 되는 것:

- `api`
- `router`
- raw server response
- submit 함수 전체
- 상위 페이지의 loading orchestration

섹션은 입력 화면입니다. 저장 판단, 서버 통신, 라우팅 판단은 바깥에서 합니다.

## 8. UI 규칙

### 8.0 관리자 shell / 사이드바

- `profileImage`, `existingMedia`, preview modal, upload modal?? form field? ?? ??? UI ??? create/edit? ???? `hooks/{domain}/use*MediaState.ts`? ????.
- 사이드바의 병의원/뷰티 토글 상태와 메뉴 조합은 `apps/staff-web`가 소유합니다.
- `packages/ui-admin` 사이드바에는 app 전용 도메인 개념을 넣지 않습니다.
- 사이드바 메뉴는 `도메인 전용 영역`과 `공통 영역`을 분리합니다.
- 최종 sidebar 렌더링에서도 `main`은 도메인 메뉴, `others`는 공통 메뉴로 유지합니다.
- 대시보드도 단일 공용으로 두지 않고 도메인별로 분리합니다.
- 현재 기준으로 `공지사항` 아래는 공통 메뉴로 유지합니다.
- 뷰티 전용 placeholder/menu route는 병의원/공통 메뉴와 경로 의미가 섞이지 않도록 `/beauty-*` prefix namespace를 사용합니다.

### 8.1 알림

- 브라우저 `alert()` 금지
- 하단 전역 alert만 사용

### 8.2 로딩

- 페이지/섹션 로딩은 spinner 기반
- 문구보다 spinner를 우선

### 8.3 선택 UI

- 병의원에서 이미 쓰는 `Select` 패턴이 있으면 새 버튼 그룹을 만들지 않습니다.
- status / allow_status / approval 류는 우선 `Select` 재사용을 검토합니다.
- 설명이 붙는 boolean 설정은 `packages/ui-admin`의 `FormSettingToggleRow`를 우선 재사용합니다.

### 8.4 에디터

- HTML 본문이 필요한 관리자 공통 CRUD는 `packages/ui-admin`의 `RichTextEditor`를 우선 재사용합니다.
- 공지사항처럼 에디터 이미지 업로드 API가 따로 있는 경우, editor 컴포넌트에 도메인 API callback만 주입합니다.
- create는 temp image 업로드 + cleanup을 사용합니다.
- edit는 권한 구조와 기존 API 계약에 맞춰 notice id 기반 업로드를 사용할 수 있습니다.

### 8.5 미디어

- 업로드는 가능한 한 `MediaUploader`를 재사용합니다.
- create/edit에서 동작 차이를 최소화합니다.
- 수정 폼 미디어 payload는 최종 상태 기준으로 보냅니다.
- 단일 파일은 `existing_*_id + new file`, 다중 파일은 `existing_*_ids[] + new files[]`를 기본 규칙으로 씁니다.
- `remove_*` 플래그보다 기존 id sync semantics를 우선합니다.
- 기존/신규 다중 파일을 한 리스트에서 섞어 정렬하거나 대표를 바꿔야 하는 컬렉션은 `gallery_order[]` 같은 명시적 순서 payload를 씁니다.
- 현재 병의원 갤러리는 `existing:{id}` / `new:{index}` 토큰 기반 `gallery_order[]`를 사용합니다.
- 예외: 동영상 원본 파일(`video_file`)은 staff가 교체하지 않으므로 `remove_video_file`만 허용합니다.
- 다중 파일 수정 UI는 기존 파일 목록과 새 파일 목록을 동시에 보여주고, 최대 개수는 둘을 합산해서 계산합니다.
- 동영상 게시기간은 `무기한 게시`가 아닐 때 `publish_start_at`, `publish_end_at`를 둘 다 필수로 받습니다.
- object URL 생성/해제는 공통 hook을 사용합니다.
- 파일 조건 검증은 공통 helper + 도메인 rule object 조합으로 처리합니다.
- 리스트 thumbnail preload 때문에 데이터 렌더링을 지연하지 않습니다.

### 8.6 모달

- 같은 panel / header / footer 구조가 두 군데 이상 반복되면 `packages/ui-admin`의 modal 조합 컴포넌트를 우선 재사용합니다.
- 앱 도메인 문구와 필드만 `apps/staff-web`에서 조립하고, 모달 기본 레이아웃 스타일은 `ui-admin`에 둡니다.

### 8.7 운영 히스토리

- 운영 히스토리 응답은 `changes` 배열을 우선 사용합니다.
- `field`, `before_value`, `after_value`는 백엔드 호환 필드이므로 신규 화면의 기본 렌더링 기준으로 쓰지 않습니다.
- 단건 변경은 `changes` 1건, 다중 변경은 하나의 history 아래 `changes` 여러 건으로 표시합니다.
- 변경 상세 표시는 `field_label`, `after_display`, `before_display`를 우선 사용합니다.
- 표시값이 없을 때만 `after_value`, `before_value`를 fallback으로 문자열화합니다.
- 기존 상태/사유만 간단히 보여주는 댓글 이력 UI는 유지할 수 있지만, 신규 상세 이력 UI는 `changes` 구조를 기준으로 만듭니다.

## 9. 성능 규칙

속도 개선은 기능 개발과 같은 우선순위로 봅니다.

### 9.1 기본 원칙

- 먼저 데이터가 보이고, 이미지는 뒤따라와도 됩니다.
- 독립 API는 병렬 요청합니다.
- 같은 option/list API를 한 화면에서 반복 호출하지 않습니다.
- 초기 렌더링에 필요 없는 계산은 사용자 액션 시점으로 미룹니다.
- 큰 컴포넌트에서 렌더마다 새 배열/객체/함수를 많이 만들면 `useMemo/useCallback`을 검토합니다.
- 단, 성능 근거 없이 모든 함수를 memoize하지 않습니다.

### 9.2 금지

- list fetch 후 이미지 preload를 `await`해서 table 렌더를 늦추는 패턴
- 검색 입력 key stroke마다 list API 호출
- 같은 route 진입 때 summary/list/options를 순차 호출하는 패턴
- section UI 안에서 option API를 각각 호출하는 패턴
- placeholder layout shift를 방치하는 이미지/카드 UI
- Client 컴포넌트 하나에 무거운 table, modal, form, media preview를 전부 몰아넣는 구조

### 9.3 측정 기준

- 성능 개선 전후는 브라우저 Network와 React 렌더 체감 기준을 같이 봅니다.
- 목록 새로고침이 느리면 API 시간, 프론트 normalize 시간, 이미지 로딩 대기, 렌더 비용을 분리해서 봅니다.
- 로컬 기준 1.5초 이상 걸리는 목록은 병목을 분해해서 기록합니다.
- 실서버에서 빨라질 것이라고 가정하지 않습니다. 로컬에서 프론트가 기다리는 작업은 실서버에서도 비용입니다.

### 9.4 리팩토링 우선순위

성능 목적 리팩토링은 아래 순서로 합니다.

1. 불필요한 직렬 API 제거
2. 렌더를 막는 이미지/파일 preload 제거
3. 중복 fetch 제거
4. 공통 list fetch hook 도입
5. 대형 Client 컴포넌트 분리
6. memoization 적용

## 10. 권한 규칙

- 메뉴 노출과 라우트 보호는 같은 permission 기준을 공유해야 합니다.
- 서버 권한 검증을 프론트가 대체하지 않습니다.
- 프론트 권한은 UX 제어 목적입니다.
- 정적 관리자 경로 permission source는 `lib/common/routing/route-permissions.ts`에 둡니다.
- `route-permissions.ts`는 정적 경로 permission source와 동적 route 매칭 규칙을 함께 소유합니다.
- 사이드바는 path별 permission string을 하드코딩하지 말고 `route-permissions.ts`의 정적 경로 helper를 참조합니다.
- `카테고리`와 `해시태그`처럼 메뉴 그룹이 같아도 서버 permission이 다르면 각각 별도 permission으로 연결합니다.
- 병의원 후기 라우트는 `beaulab.hospital_review.show`, 병의원 평가 라우트는 `beaulab.hospital_evaluation.show`를 사용합니다.
- 라우트 권한은 fail-closed를 기본으로 합니다.
- 신규 페이지를 만들 때 권한 매핑을 추가하지 않으면 접근 불가가 기본이어야 합니다.
- `common.access`는 임시 권한으로만 사용하고, 도메인 권한이 생기면 즉시 대체합니다.
- 미완성 placeholder 페이지도 메뉴에 노출한다면 권한 매핑을 가져야 합니다.

## 11. 문서 갱신 규칙

아래 중 하나가 바뀌면 문서도 같이 갱신합니다.

- 폴더 구조
- common 경계
- 권한 구조
- create/edit/list 공통 패턴
- 관리자 shell 구조
- form/list/media/permission/성능 공통 패턴

갱신 대상:

- [architecture.md](/root/beaulab_frontend/doc/architecture.md)
- [staff-web-rules.md](/root/beaulab_frontend/doc/staff-web-rules.md)
- 필요 시 [README.md](/root/beaulab_frontend/README.md)

## 12. 작업 전 체크리스트

- 이 코드가 `common`인지 `hospital/doctor`인지 명확한가
- 새 파일 분리가 섹션 단위인지, 과분리인지 확인했는가
- 기존 `Select`, `MediaUploader`, spinner, alert 패턴을 먼저 재사용했는가
- 목록 문맥(`returnTo`, `highlight`, URL query`)을 깨지 않았는가
- form state, API submit, validation, media, section UI 책임이 섞이지 않았는가
- 목록/상세/폼에서 불필요한 직렬 요청이나 렌더 blocking 작업이 없는가
- 신규 route 권한이 fail-closed 기준으로 매핑되어 있는가
- 문서 갱신이 필요한 변경인지 확인했는가
