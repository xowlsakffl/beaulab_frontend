# Staff Web Rules

이 문서는 `apps/staff-web`에서 앞으로 지켜야 할 리팩토링/구조/구현 규칙을 정리합니다.

작성 기준: 2026-03-23

## 1. 공통 원칙

- 현재 코드가 문서의 기준입니다.
- 추상화는 “예쁘게 보이는가”가 아니라 “변경 비용을 실제로 줄이는가”로 판단합니다.
- 병의원/의료진처럼 이미 반복되는 패턴이 있는 화면은 먼저 기존 패턴을 재사용합니다.
- 새 구조를 만들기 전에 기존 `hospital`, `doctor`, `common`의 위치와 역할을 먼저 봅니다.

## 2. 폴더 규칙

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
- 의료진 병원 검색/프로필/증빙 로직
- 병의원/의료진 `form.ts`, `list.ts`
- 도메인 field name을 아는 validation / error mapping / focus mapping

## 3. 컴포넌트 분리 규칙

### 3.1 섹션 단위까지만 분리

병의원/의료진 폼은 섹션 단위까지만 분리합니다.

현재 기준:

- 병의원 폼
  - 기본정보
  - 사업자정보
  - 미디어
- 의료진 폼
  - 기본정보
  - 시술분야
  - 의사정보

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
- `useDoctorHospitalOptions`
- `useHospitalFieldFocus`
- `useDoctorFieldFocus`

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

### 5.2 `lib/hospital`, `lib/doctor`

다음만 둡니다.

- form 기본값
- option 상수
- 타입
- 검증
- error mapping
- detail/list mapper
- query builder

페이지 상태 자체는 `lib`로 빼지 않습니다.

## 6. 목록 페이지 규칙

병의원/의료진 목록은 같은 패턴을 지킵니다.

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

## 8. UI 규칙

### 8.1 알림

- 브라우저 `alert()` 금지
- 하단 전역 alert만 사용

### 8.2 로딩

- 페이지/섹션 로딩은 spinner 기반
- 문구보다 spinner를 우선

### 8.3 선택 UI

- 병의원에서 이미 쓰는 `Select` 패턴이 있으면 새 버튼 그룹을 만들지 않습니다.
- status / allow_status / approval 류는 우선 `Select` 재사용을 검토합니다.

### 8.4 미디어

- 업로드는 가능한 한 `MediaUploader`를 재사용합니다.
- create/edit에서 동작 차이를 최소화합니다.

## 9. 권한 규칙

- 메뉴 노출과 라우트 보호는 같은 permission 기준을 공유해야 합니다.
- 서버 권한 검증을 프론트가 대체하지 않습니다.
- 프론트 권한은 UX 제어 목적입니다.

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
