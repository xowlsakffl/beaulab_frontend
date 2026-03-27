# Staff Web Rules

이 문서는 `apps/staff-web`에서 앞으로 지켜야 할 리팩토링/구조/구현 규칙을 정리합니다.

작성 기준: 2026-03-27

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
- 병의원/공지사항/의료진 `form.ts`, `list.ts`
- 동영상 `form.ts`, `list.ts`
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

### 5.2 `lib/hospital`, `lib/notice`, `lib/doctor`, `lib/video`, `lib/hashtag`

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

## 6. 목록 페이지 규칙

병의원/공지사항/의료진/동영상 목록은 같은 패턴을 지킵니다.

- 검색/필터/정렬/페이지/per_page는 URL과 동기화합니다.
- 새로고침 후에도 현재 목록 문맥이 복원되어야 합니다.
- 상세 진입 시 `returnTo`를 유지합니다.
- 등록/수정 후 복귀 시 `highlight`로 해당 행을 강조합니다.
- 행 클릭 전환은 `router.prefetch()`를 같이 씁니다.

## 7. 등록/수정 폼 규칙

- `*Client.tsx`가 submit, fetch, redirect, error state를 소유합니다.
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

## 8. UI 규칙

### 8.0 관리자 shell / 사이드바

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

### 8.6 모달

- 같은 panel / header / footer 구조가 두 군데 이상 반복되면 `packages/ui-admin`의 modal 조합 컴포넌트를 우선 재사용합니다.
- 앱 도메인 문구와 필드만 `apps/staff-web`에서 조립하고, 모달 기본 레이아웃 스타일은 `ui-admin`에 둡니다.

## 9. 권한 규칙

- 메뉴 노출과 라우트 보호는 같은 permission 기준을 공유해야 합니다.
- 서버 권한 검증을 프론트가 대체하지 않습니다.
- 프론트 권한은 UX 제어 목적입니다.
- 정적 관리자 경로 permission source는 `lib/common/routing/route-permissions.ts`에 둡니다.
- `route-permissions.ts`는 정적 경로 permission source와 동적 route 매칭 규칙을 함께 소유합니다.
- 사이드바는 path별 permission string을 하드코딩하지 말고 `route-permissions.ts`의 정적 경로 helper를 참조합니다.
- `카테고리`와 `해시태그`처럼 메뉴 그룹이 같아도 서버 permission이 다르면 각각 별도 permission으로 연결합니다.

## 10. 문서 갱신 규칙

아래 중 하나가 바뀌면 문서도 같이 갱신합니다.

- 폴더 구조
- common 경계
- 권한 구조
- create/edit/list 공통 패턴
- 관리자 shell 구조

갱신 대상:

- [architecture.md](/root/beaulab_frontend/doc/architecture.md)
- [staff-web-rules.md](/root/beaulab_frontend/doc/staff-web-rules.md)
- 필요 시 [README.md](/root/beaulab_frontend/README.md)

## 11. 작업 전 체크리스트

- 이 코드가 `common`인지 `hospital/doctor`인지 명확한가
- 새 파일 분리가 섹션 단위인지, 과분리인지 확인했는가
- 기존 `Select`, `MediaUploader`, spinner, alert 패턴을 먼저 재사용했는가
- 목록 문맥(`returnTo`, `highlight`, URL query`)을 깨지 않았는가
- 문서 갱신이 필요한 변경인지 확인했는가
