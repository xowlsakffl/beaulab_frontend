# Frontend Architecture

이 문서는 현재 `beaulab_frontend`의 실제 구조를 기준으로 정리한 운영 문서입니다.

작성 기준: 2026-03-23

## 1. 범위

현재 실제 운영 기준 앱은 `apps/staff-web`입니다.

모노레포 전체 구조는 아래처럼 봅니다.

```text
beaulab_frontend/
├─ apps/
│  └─ staff-web/
├─ packages/
│  ├─ api-client/
│  ├─ auth/
│  ├─ types/
│  └─ ui-admin/
└─ doc/
```

핵심 전제:

- `packages/*`는 범용 레이어입니다.
- 실제 관리자 제품 로직은 `apps/staff-web`가 소유합니다.
- 이 문서는 “미래에 이렇게 될 예정”이 아니라 “지금 이렇게 되어 있음”만 적습니다.

## 2. 계층

```text
Laravel API
  -> 도메인 데이터, 저장 규칙, 최종 권한 검증

packages/*
  -> 범용 UI / auth / types / HTTP 기반

apps/staff-web
  -> 관리자 앱 화면, 라우트, 메뉴, 권한 매핑, feature 흐름
```

규칙:

- 앱은 `packages/*`를 조합합니다.
- `packages/*`는 앱 도메인이나 라우트를 알면 안 됩니다.
- 메뉴, 보호 라우트, actor 세션, 병의원/의료진 업무 흐름은 `apps/staff-web`에 둡니다.

## 3. `apps/staff-web` 현재 구조

현재 기준 권장 구조이자 실제 구조는 아래와 같습니다.

```text
apps/staff-web/
├─ app/
│  ├─ (admin)/
│  └─ (auth)/
├─ components/
│  ├─ common/
│  ├─ hospital/
│  │  ├─ form/
│  │  └─ list/
│  └─ doctor/
│     ├─ form/
│     └─ list/
├─ hooks/
│  ├─ common/
│  ├─ hospital/
│  └─ doctor/
└─ lib/
   ├─ common/
   │  ├─ api.ts
   │  ├─ category.ts
   │  ├─ auth/
   │  │  └─ session.ts
   │  ├─ navigation/
   │  │  └─ buildReturnToPath.ts
   │  └─ routing/
   │     ├─ admin-pages.tsx
   │     └─ route-permissions.ts
   ├─ hospital/
   │  ├─ form.ts
   │  └─ list.ts
   └─ doctor/
      ├─ form.ts
      └─ list.ts
```

## 4. 디렉토리 책임

### 4.1 `app/`

페이지 엔트리와 레이아웃을 둡니다.

역할:

- 라우트 단위 page/layout 정의
- 페이지 클라이언트 컴포넌트 연결
- 권한 보호 shell 진입

원칙:

- `page.tsx`는 얇게 유지합니다.
- 무거운 폼/목록 로직은 `*Client.tsx`로 분리합니다.

### 4.2 `components/common/`

`staff-web` 관리자 앱 전체에서 공통으로 쓰는 앱 전용 컴포넌트를 둡니다.

현재 예:

- [guard.tsx](/root/beaulab_frontend/apps/staff-web/components/common/guard.tsx)
- [sidebar-menu.tsx](/root/beaulab_frontend/apps/staff-web/components/common/sidebar-menu.tsx)

여기는 `packages/ui-admin`와 다릅니다.

- `ui-admin`은 제품 비의존 UI
- `components/common`은 staff 관리자 앱 전용 adapter

### 4.3 `components/hospital`, `components/doctor`

도메인 전용 UI를 둡니다.

현재 원칙:

- 폼은 섹션 단위까지만 분리합니다.
- 목록도 toolbar / filter / table 정도까지만 분리합니다.

예:

- 병의원 폼: `Basic / Business / Media`
- 의료진 폼: `Basic / Category / Medical`

### 4.4 `hooks/common/`

도메인 이름 없이 설명 가능한 훅만 둡니다.

현재 예:

- [useCategorySelectorLoader.ts](/root/beaulab_frontend/apps/staff-web/hooks/common/useCategorySelectorLoader.ts)
- [useDaumPostcode.ts](/root/beaulab_frontend/apps/staff-web/hooks/common/useDaumPostcode.ts)
- [useFormFieldFocus.ts](/root/beaulab_frontend/apps/staff-web/hooks/common/useFormFieldFocus.ts)
- [useGoBack.ts](/root/beaulab_frontend/apps/staff-web/hooks/common/useGoBack.ts)

### 4.5 `hooks/hospital`, `hooks/doctor`

도메인 필드명, DOM target, API endpoint에 직접 묶인 훅을 둡니다.

현재 예:

- [useHospitalAddressSearch.ts](/root/beaulab_frontend/apps/staff-web/hooks/hospital/useHospitalAddressSearch.ts)
- [useHospitalFeatureList.ts](/root/beaulab_frontend/apps/staff-web/hooks/hospital/useHospitalFeatureList.ts)
- [useHospitalFieldFocus.ts](/root/beaulab_frontend/apps/staff-web/hooks/hospital/useHospitalFieldFocus.ts)
- [useDoctorHospitalOptions.ts](/root/beaulab_frontend/apps/staff-web/hooks/doctor/useDoctorHospitalOptions.ts)
- [useDoctorFieldFocus.ts](/root/beaulab_frontend/apps/staff-web/hooks/doctor/useDoctorFieldFocus.ts)

### 4.6 `lib/common/`

`staff-web` 전체에서 공통으로 쓰는 순수 함수, 설정, 세션, 라우팅 규칙을 둡니다.

현재 세부 구조:

- `api.ts`
  - staff API client
- `category.ts`
  - 카테고리 selector 정규화 타입/함수
- `auth/session.ts`
  - login / restoreSession / ensureSession / logout
- `routing/admin-pages.tsx`
  - 관리자 기본 페이지 정의와 metadata/breadcrumb helper
- `routing/route-permissions.ts`
  - 경로별 permission 규칙
- `navigation/buildReturnToPath.ts`
  - list -> detail -> list 복귀 경로 조립

### 4.7 `lib/hospital`, `lib/doctor`

도메인별 상수, validation, mapper, query helper를 둡니다.

현재 역할:

- `form.ts`
  - form 기본값
  - option 상수
  - 응답 타입
  - field error 정규화
  - detail -> form 매핑
  - submit 전 검증
- `list.ts`
  - 목록 filter/sort/query builder
  - URL state parse/build
  - row normalize
  - returnTo helper

## 5. 현재 CRUD 패턴

### 5.1 목록

병의원과 의료진 목록은 같은 운영 패턴을 따릅니다.

핵심 흐름:

1. URL query를 파싱해 초기 목록 상태를 만듭니다.
2. 검색/필터/정렬/페이지를 상태로 관리합니다.
3. 상태가 바뀌면 query string도 다시 맞춥니다.
4. API 응답은 도메인 `list.ts`에서 row 형태로 정규화합니다.
5. 행 클릭 시 detail URL로 이동하면서 `returnTo` 문맥을 유지합니다.
6. 등록/수정 후 목록으로 복귀하면 `highlight` query로 행 강조를 처리합니다.

현재 관련 파일:

- 병의원 목록
  - [HospitalsTableClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/hospitals/HospitalsTableClient.tsx)
  - [HospitalsDataTable.tsx](/root/beaulab_frontend/apps/staff-web/components/hospital/list/HospitalsDataTable.tsx)
  - [list.ts](/root/beaulab_frontend/apps/staff-web/lib/hospital/list.ts)
- 의료진 목록
  - [DoctorsTableClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/doctors/DoctorsTableClient.tsx)
  - [DoctorsDataTable.tsx](/root/beaulab_frontend/apps/staff-web/components/doctor/list/DoctorsDataTable.tsx)
  - [list.ts](/root/beaulab_frontend/apps/staff-web/lib/doctor/list.ts)

### 5.2 등록/수정 폼

병의원과 의료진 폼은 같은 큰 흐름을 따릅니다.

핵심 흐름:

1. `*Client.tsx`가 실제 상태/submit/fetch를 소유합니다.
2. 화면은 섹션 컴포넌트에 분리합니다.
3. form 상수와 검증은 도메인 `form.ts`에 둡니다.
4. 에러가 나면 첫 번째 필드로 스크롤 + 포커스를 보냅니다.
5. 성공 알림은 전역 하단 alert를 사용합니다.
6. 성공 후에는 목록으로 복귀하고 `highlight`를 남깁니다.

현재 관련 파일:

- 병의원 생성/수정
  - [HospitalsCreateFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/hospitals/new/HospitalsCreateFormClient.tsx)
  - [HospitalDetailFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/hospitals/[id]/HospitalDetailFormClient.tsx)
  - [form.ts](/root/beaulab_frontend/apps/staff-web/lib/hospital/form.ts)
- 의료진 생성/수정
  - [DoctorsCreateFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/doctors/new/DoctorsCreateFormClient.tsx)
  - [DoctorDetailFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/doctors/[id]/DoctorDetailFormClient.tsx)
  - [form.ts](/root/beaulab_frontend/apps/staff-web/lib/doctor/form.ts)

## 6. 권한/메뉴/세션

현재 기준 보호 흐름은 아래 조합으로 동작합니다.

- 세션 관리
  - [session.ts](/root/beaulab_frontend/apps/staff-web/lib/common/auth/session.ts)
- 라우트 권한
  - [route-permissions.ts](/root/beaulab_frontend/apps/staff-web/lib/common/routing/route-permissions.ts)
- guard
  - [guard.tsx](/root/beaulab_frontend/apps/staff-web/components/common/guard.tsx)
- 사이드바 메뉴
  - [sidebar-menu.tsx](/root/beaulab_frontend/apps/staff-web/components/common/sidebar-menu.tsx)
- 관리자 기본 페이지 정의
  - [admin-pages.tsx](/root/beaulab_frontend/apps/staff-web/lib/common/routing/admin-pages.tsx)

규칙:

- 메뉴 권한과 라우트 권한은 같은 permission 모델을 공유해야 합니다.
- 서버 검증을 대체하지 않습니다.
- 프론트 권한은 UX 제어 목적으로만 사용합니다.

## 7. UI 정책

현재 관리자 UI 정책은 아래를 따릅니다.

- 브라우저 `alert()` 금지
- 성공/실패 피드백은 하단 전역 alert 사용
- 페이지/섹션 로딩은 spinner 사용
- status/approval 같은 선택은 기존 `Select` 재사용 우선
- create/edit 미디어 UX는 같은 컴포넌트를 재사용

## 8. 무엇을 어디에 둘 것인가

### `components/common`으로 갈 수 있는 것

- staff 관리자 전체에서 재사용되는 앱 전용 adapter
- guard, sidebar menu, admin shell helper

### `hooks/common`으로 갈 수 있는 것

- 도메인 이름 없이 설명 가능한 훅
- 병의원/의료진 둘 다 같은 방식으로 쓰는 훅

### `lib/common`으로 갈 수 있는 것

- 순수 함수
- 세션 복구/로그인
- 라우트 권한 매핑
- query path 조립

### 도메인 폴더에 남겨야 하는 것

- 병의원/의료진 필드명에 직접 묶인 코드
- 특정 API endpoint에만 의미가 있는 코드
- 특정 DOM selector를 아는 포커스 로직
- 도메인 상수, option, validation, mapper

## 9. 같이 봐야 할 문서

- [리팩토링 규칙 문서](/root/beaulab_frontend/doc/staff-web-rules.md)
- [루트 README](/root/beaulab_frontend/README.md)
