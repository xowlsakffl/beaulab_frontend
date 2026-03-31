# Frontend Architecture

이 문서는 현재 `beaulab_frontend`의 실제 구조를 기준으로 정리한 운영 문서입니다.

작성 기준: 2026-03-27

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
- 메뉴, 보호 라우트, actor 세션, 병의원/공지사항/의료진 업무 흐름은 `apps/staff-web`에 둡니다.
- 설명이 붙는 공통 form UI 패턴은 `packages/ui-admin`에 둡니다.
- 반복되는 modal panel / header / footer 패턴도 `packages/ui-admin`에 둡니다.

## 3. `apps/staff-web` 현재 구조

현재 기준 권장 구조이자 실제 구조는 아래와 같습니다.

```text
apps/staff-web/
├─ app/
│  ├─ (admin)/
│  │  └─ (pages)/
│  │     ├─ (common)/
│  │     ├─ (hospital)/
│  │     └─ (beauty)/
│  └─ (auth)/
├─ components/
│  ├─ common/
│  ├─ hashtag/
│  │  └─ list/
│  ├─ talk/
│  │  └─ list/
│  ├─ hospital/
│  │  ├─ form/
│  │  └─ list/
│  ├─ notice/
│  │  ├─ form/
│  │  └─ list/
│  ├─ doctor/
│  │  ├─ form/
│  │  └─ list/
│  └─ video/
│     ├─ form/
│     └─ list/
├─ hooks/
│  ├─ common/
│  ├─ hospital/
│  ├─ notice/
│  ├─ doctor/
│  └─ video/
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
   ├─ hashtag/
   │  └─ list.ts
   ├─ talk/
   │  └─ list.ts
   ├─ notice/
   │  ├─ form.ts
   │  └─ list.ts
   ├─ doctor/
   │  ├─ form.ts
   │  └─ list.ts
   └─ video/
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
- `(admin)/(pages)` 아래 route group과 공통 페이지는 `common / hospital / beauty` 기준으로만 나눕니다.

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

현재 사이드바 메뉴는 아래 기준으로 조합합니다.

- `sidebar-menu.tsx`가 병의원/뷰티 도메인 메뉴와 공통 메뉴를 따로 정의합니다.
- `app/(admin)/layout.tsx`가 현재 domain toggle 상태를 들고 최종 메뉴를 합칩니다.
- `packages/ui-admin`의 `AppSidebar`는 전달받은 `topContent`와 메뉴를 렌더링만 합니다.
- 최종 렌더링에서도 `main=도메인 메뉴`, `others=공통 메뉴`를 유지해서 섹션 라벨을 분리합니다.
- 대시보드도 도메인별로 분리합니다. 현재 기준 병의원은 `/`, 뷰티는 `/beauty-dashboard`를 사용합니다.
- 뷰티 도메인 전용 placeholder 페이지는 병의원/공통 경로와 의미 충돌을 피하려고 `/beauty-*` prefix route를 사용합니다.

### 4.3 `components/hospital`, `components/notice`, `components/doctor`, `components/video`, `components/hashtag`, `components/talk`

도메인 전용 UI를 둡니다.

현재 원칙:

- 폼은 섹션 단위까지만 분리합니다.
- 목록도 toolbar / filter / table 정도까지만 분리합니다.
- 해시태그처럼 단일 필드 관리자 마스터 CRUD는 목록 페이지 기준으로 `toolbar / table / modal` 정도만 분리합니다.
- 모달 내부 레이아웃이 여러 화면에서 반복되면 `packages/ui-admin`의 modal 조합 컴포넌트를 우선 재사용합니다.

예:

- 병의원 폼: `Basic / Business / Media`
- 공지사항 폼: `Main(Basic+Content) / Attachments`
- 의료진 폼: `Basic / Category / Medical`
- 동영상 폼: `Basic / Category / Publish / Media`
- 해시태그 목록: `Toolbar / DataTable / UpsertModal`
- 토크 목록: `Toolbar / Filter / DataTable`

동영상처럼 병의원/의료진과 다른 독립 CRUD 기능은 별도 도메인 폴더를 둘 수 있습니다.

예:

- `components/video/form`
- `components/video/list`

### 4.4 `hooks/common/`

도메인 이름 없이 설명 가능한 훅만 둡니다.

현재 예:

- [useCategorySelectorLoader.ts](/root/beaulab_frontend/apps/staff-web/hooks/common/useCategorySelectorLoader.ts)
- [useDaumPostcode.ts](/root/beaulab_frontend/apps/staff-web/hooks/common/useDaumPostcode.ts)
- [useFormFieldFocus.ts](/root/beaulab_frontend/apps/staff-web/hooks/common/useFormFieldFocus.ts)
- [useGoBack.ts](/root/beaulab_frontend/apps/staff-web/hooks/common/useGoBack.ts)

### 4.5 `hooks/hospital`, `hooks/notice`, `hooks/doctor`, `hooks/video`

도메인 필드명, DOM target, API endpoint에 직접 묶인 훅을 둡니다.

현재 예:

- [useHospitalAddressSearch.ts](/root/beaulab_frontend/apps/staff-web/hooks/hospital/useHospitalAddressSearch.ts)
- [useHospitalFeatureList.ts](/root/beaulab_frontend/apps/staff-web/hooks/hospital/useHospitalFeatureList.ts)
- [useHospitalFieldFocus.ts](/root/beaulab_frontend/apps/staff-web/hooks/hospital/useHospitalFieldFocus.ts)
- [useNoticeFieldFocus.ts](/root/beaulab_frontend/apps/staff-web/hooks/notice/useNoticeFieldFocus.ts)
- [useNoticeEditorTempImages.ts](/root/beaulab_frontend/apps/staff-web/hooks/notice/useNoticeEditorTempImages.ts)
- [useDoctorHospitalOptions.ts](/root/beaulab_frontend/apps/staff-web/hooks/doctor/useDoctorHospitalOptions.ts)
- [useDoctorFieldFocus.ts](/root/beaulab_frontend/apps/staff-web/hooks/doctor/useDoctorFieldFocus.ts)
- [useVideoHospitalOptions.ts](/root/beaulab_frontend/apps/staff-web/hooks/video/useVideoHospitalOptions.ts)
- [useVideoDoctorOptions.ts](/root/beaulab_frontend/apps/staff-web/hooks/video/useVideoDoctorOptions.ts)
- [useVideoFieldFocus.ts](/root/beaulab_frontend/apps/staff-web/hooks/video/useVideoFieldFocus.ts)

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
  - placeholder 관리자 페이지 정의와 metadata/breadcrumb helper
- `routing/route-permissions.ts`
  - 정적 관리자 경로 permission source
  - 동적 경로 permission 매칭 규칙
- `navigation/buildReturnToPath.ts`
  - list -> detail -> list 복귀 경로 조립

### 4.7 `lib/hospital`, `lib/notice`, `lib/doctor`, `lib/video`, `lib/hashtag`, `lib/talk`

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

공지사항, 동영상처럼 독립 CRUD 기능도 같은 기준으로 `lib/notice/form.ts`, `lib/notice/list.ts`, `lib/video/form.ts`, `lib/video/list.ts`에 둡니다.
해시태그처럼 단일 페이지 CRUD는 `lib/hashtag/list.ts` 하나에서 목록 query helper와 입력 sanitize/validate를 같이 둘 수 있습니다.
토크처럼 공통 게시물 하위의 독립 목록도 `lib/talk/list.ts` 하나에서 URL state, row mapper, query helper를 같이 둡니다.

## 5. 현재 CRUD 패턴

### 5.1 목록

병의원, 공지사항, 의료진, 동영상, 토크 목록은 같은 운영 패턴을 따릅니다.

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
- 공지사항 목록
  - [NoticesTableClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(common)/notices/NoticesTableClient.tsx)
  - [NoticesDataTable.tsx](/root/beaulab_frontend/apps/staff-web/components/notice/list/NoticesDataTable.tsx)
  - [list.ts](/root/beaulab_frontend/apps/staff-web/lib/notice/list.ts)
- 의료진 목록
  - [DoctorsTableClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/doctors/DoctorsTableClient.tsx)
  - [DoctorsDataTable.tsx](/root/beaulab_frontend/apps/staff-web/components/doctor/list/DoctorsDataTable.tsx)
  - [list.ts](/root/beaulab_frontend/apps/staff-web/lib/doctor/list.ts)
- 동영상 목록
  - [VideosTableClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/videos/VideosTableClient.tsx)
  - [VideosDataTable.tsx](/root/beaulab_frontend/apps/staff-web/components/video/list/VideosDataTable.tsx)
  - [list.ts](/root/beaulab_frontend/apps/staff-web/lib/video/list.ts)
- 토크 목록
  - [TalksTableClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/talks/TalksTableClient.tsx)
  - [TalksDataTable.tsx](/root/beaulab_frontend/apps/staff-web/components/talk/list/TalksDataTable.tsx)
  - [list.ts](/root/beaulab_frontend/apps/staff-web/lib/talk/list.ts)

### 5.2 등록/수정 폼

병의원, 공지사항, 의료진, 동영상 폼은 같은 큰 흐름을 따릅니다.

핵심 흐름:

1. `*Client.tsx`가 실제 상태/submit/fetch를 소유합니다.
2. 화면은 섹션 컴포넌트에 분리합니다.
3. form 상수와 검증은 도메인 `form.ts`에 둡니다.
4. 에러가 나면 첫 번째 필드로 스크롤 + 포커스를 보냅니다.
5. 성공 알림은 전역 하단 alert를 사용합니다.
6. 성공 후에는 목록으로 복귀하고 `highlight`를 남깁니다.
7. 병의원 폼의 `병의원정보(feature_ids)`는 create/edit 모두 최소 1개 이상 선택해야 합니다.

권한이 분리된 리소스는 상세와 수정을 같은 route에 섞지 않습니다.

- 상세: `/resource/[id]`
- 수정: `/resource/[id]/edit`
- 수정 페이지 데이터 로딩은 별도 `/edit` API를 만들지 않고, 상세 GET(`/resource/{id}`)를 재사용합니다.

현재 관련 파일:

- 병의원 생성/수정
  - [HospitalsCreateFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/hospitals/new/HospitalsCreateFormClient.tsx)
  - [HospitalDetailPageClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/hospitals/[id]/HospitalDetailPageClient.tsx)
  - [HospitalEditFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/hospitals/[id]/edit/HospitalEditFormClient.tsx)
  - [form.ts](/root/beaulab_frontend/apps/staff-web/lib/hospital/form.ts)
- 공지사항 생성/수정
  - [NoticesCreateFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(common)/notices/new/NoticesCreateFormClient.tsx)
  - [NoticeDetailPageClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(common)/notices/[id]/NoticeDetailPageClient.tsx)
  - [NoticeEditFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(common)/notices/[id]/edit/NoticeEditFormClient.tsx)
  - [form.ts](/root/beaulab_frontend/apps/staff-web/lib/notice/form.ts)
- 의료진 생성/수정
  - [DoctorsCreateFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/doctors/new/DoctorsCreateFormClient.tsx)
  - [DoctorDetailPageClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/doctors/[id]/DoctorDetailPageClient.tsx)
  - [DoctorEditFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/doctors/[id]/edit/DoctorEditFormClient.tsx)
  - [form.ts](/root/beaulab_frontend/apps/staff-web/lib/doctor/form.ts)
- 동영상 생성/수정
  - [VideosCreateFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/videos/new/VideosCreateFormClient.tsx)
  - [VideoDetailPageClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/videos/[id]/VideoDetailPageClient.tsx)
  - [VideoEditFormClient.tsx](/root/beaulab_frontend/apps/staff-web/app/(admin)/(pages)/(hospital)/videos/[id]/edit/VideoEditFormClient.tsx)
  - [form.ts](/root/beaulab_frontend/apps/staff-web/lib/video/form.ts)
  - 무기한 게시가 아니면 `publish_start_at`, `publish_end_at`를 둘 다 필수로 검증합니다.
  - 공지사항 본문 편집은 [RichTextEditor.tsx](/root/beaulab_frontend/packages/ui-admin/src/components/form/RichTextEditor.tsx) 공용 컴포넌트를 사용하고, notice editor image API에 업로드를 연결합니다.

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

## 10. 미디어 수정 계약

- 수정 폼의 미디어는 최종 상태 기준으로 전송합니다.
- 단일 파일 컬렉션은 `existing_*_id`와 선택적인 새 파일 필드를 함께 사용합니다.
- 다중 파일 컬렉션은 `existing_*_ids[]`와 선택적인 새 파일 배열을 함께 사용합니다.
- 다중 파일 컬렉션에서 기존/신규를 섞어 순서 변경과 대표 지정이 필요하면 `gallery_order[]` 같은 명시적 순서 계약을 사용합니다.
- 삭제는 `remove_*` 플래그가 아니라, 명시적으로 보낸 기존 id 목록에서 빠지는 것으로 표현합니다.
- 백엔드 update action은 이 값을 sync semantics로 처리합니다.
  - 목록에 남은 기존 파일은 유지
  - 목록에서 빠진 기존 파일은 삭제
  - 새 파일은 기존 유지 목록 뒤에 추가
- 다중 파일 수정 UI는 기존 파일과 새 파일을 같은 화면에 함께 보여주고, 최대 개수 계산도 두 집합을 합산해서 처리합니다.
- 병의원 갤러리는 현재 `gallery_order[] = existing:{id} | new:{index}` 계약으로 기존/신규 merged reorder를 처리합니다.
- 예외: 동영상 원본 파일(`video_file`)은 staff가 교체하지 않습니다.
  - 병원계정이 업로드한 원본을 staff가 삭제만 할 수 있으므로 `remove_video_file` boolean으로 처리합니다.
  - 즉 이 케이스는 단일 파일 sync semantics보다 도메인 규칙이 우선합니다.
