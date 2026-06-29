# Frontend Architecture

작성 기준: 2026-06-29

이 문서는 현재 `beaulab_frontend` 코드 기준의 구조 문서다. 미래 계획이 아니라 지금 유지해야 하는 기준만 적는다.

## 1. 범위

현재 실제 운영 중심 앱은 `apps/staff-web`이다. `apps/user-web`은 앱 사용자 로그인, 채팅, 알림, Reverb 이벤트를 브라우저에서 수동 검증하기 위한 테스트 앱이다.

```text
beaulab_frontend/
├─ apps/
│  ├─ staff-web/
│  └─ user-web/
├─ packages/
│  ├─ api-client/
│  ├─ auth/
│  ├─ types/
│  └─ ui-admin/
└─ doc/
```

원칙:

- `packages/*`는 앱/도메인 비의존 레이어다.
- 관리자 제품 로직은 `apps/staff-web`가 소유한다.
- `apps/user-web`은 관리자 shell, 메뉴, `ui-admin` 스타일을 공유하지 않는다.
- 서버 권한 검증은 Laravel API가 최종 책임을 가진다. 프론트 권한은 UX 제어다.

## 2. 계층

```text
Laravel API
  -> 도메인 데이터, 저장 규칙, 최종 권한 검증

packages/*
  -> 범용 UI / auth / types / HTTP 기반

apps/staff-web
  -> 관리자 앱 화면, 라우트, 메뉴, 권한 매핑, feature 흐름

apps/user-web
  -> 앱 사용자 로그인/채팅/알림 API 수동 검증
```

## 3. `apps/staff-web` 구조

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
│  ├─ account-user/
│  ├─ common/
│  ├─ doctor/
│  ├─ hashtag/
│  ├─ hospital/
│  ├─ hospital-entry/
│  ├─ hospital-evaluation/
│  ├─ hospital-event/
│  ├─ hospital-event-db/
│  ├─ hospital-event-real-model-db/
│  ├─ hospital-review/
│  ├─ notice/
│  ├─ reported-content/
│  ├─ talk/
│  └─ video/
├─ hooks/
│  ├─ common/
│  ├─ doctor/
│  ├─ hospital/
│  ├─ hospital-event/
│  ├─ notice/
│  └─ video/
└─ lib/
   ├─ account-user/
   ├─ common/
   ├─ doctor/
   ├─ hashtag/
   ├─ hospital/
   ├─ hospital-entry/
   ├─ hospital-evaluation/
   ├─ hospital-event/
   ├─ hospital-event-db/
   ├─ hospital-event-real-model-db/
   ├─ hospital-review/
   ├─ notice/
   ├─ reported-content/
   ├─ talk/
   └─ video/
```

`app/(admin)/(pages)` route group은 `(common)`, `(hospital)`, `(beauty)` 세 가지만 사용한다. URL prefix는 메뉴 상위 그룹을 번역한 값으로 맞춘다.

현재 주요 URL prefix:

| Prefix                     | 소유 영역                                             |
| -------------------------- | ----------------------------------------------------- |
| `/hospital-dashboard`      | 병의원 대시보드                                       |
| `/hospital-manage`         | 병의원, 의료진, 입점신청                              |
| `/video-manage`            | 동영상                                                |
| `/ads-manage`              | 병원 이벤트                                           |
| `/customer-db-manage`      | 이벤트 DB, 리얼모델 DB                                |
| `/post-manage`             | 토크, 성형후기, 시술후기, 병의원 평가                 |
| `/reported-post-manage`    | 신고 토크/후기/평가/채팅                              |
| `/notice-manage`           | 공지사항, FAQ, 1:1 문의 placeholder                   |
| `/user-manage`             | 일반 회원                                             |
| `/category-hashtag-manage` | 카테고리, 해시태그                                    |
| `/wallet-manage`           | 충전금 placeholder                                    |
| `/content-manage`          | 배너/팝업/상단 타이틀 placeholder                     |
| `/statistics-manage`       | 통계 placeholder                                      |
| `/admin-settings`          | 프로필, 직원, 유해성 단어, 닉네임, 대행사 placeholder |
| `/beauty-*`                | 뷰티 도메인 placeholder                               |

API path와 프론트 URL prefix는 다를 수 있다. 예를 들어 이벤트 화면 URL은 `/ads-manage/events`지만 API 리소스는 `/api/v1/staff/hospital-events`다.

## 4. 디렉토리 책임

### 4.1 `app/`

- page/layout 정의
- metadata, params 전달
- `*Client.tsx` 연결
- 보호 shell 진입

`page.tsx`에는 상태, API 호출, validation을 넣지 않는다.

### 4.2 `components/common/`

`staff-web` 관리자 앱 전체에서 쓰는 앱 전용 컴포넌트를 둔다.

현재 주요 파일:

- `guard.tsx`: 세션 복구, route permission 확인, 미인증 로그인 이동
- `sidebar-menu.tsx`: 권한 기반 메뉴 정의/조합
- `LoadErrorState.tsx`: 중앙 정렬 문구 + 다시 불러오기 UI
- `AllowStatusControls.tsx`: 신청/검수/승인/반려 계열 공통 컨트롤
- `VisibilityActionButtons.tsx`: 노출/미노출 계열 버튼
- `OperationHistoryCard.tsx`, `OperationHistoryDisplay.tsx`: 운영 히스토리 렌더링
- `DetailImageGallery.tsx`, `DetailMediaCard.tsx`: 상세/수정 미디어 표시

`components/common`은 `packages/ui-admin`과 다르다. `ui-admin`은 제품 비의존 UI이고, `components/common`은 staff 관리자 앱 adapter다.

### 4.3 도메인 컴포넌트

도메인 field name, endpoint, 화면 용어를 아는 UI는 각 도메인 폴더에 둔다.

예:

- 병의원: 기본정보, 사업자/계좌정보, 미디어, 인증 계정 정보, 검수상태
- 의료진: 기본정보, 시술분야, 의사정보, 프로필/증빙 미디어, 검수상태
- 이벤트: 기본정보, 카테고리/의료진, 옵션, 이미지, 검수상태, 상담신청 현황 버튼
- 입점신청: 목록/summary/상세/승인상태 변경
- 이벤트 DB/리얼모델 DB: 신청 목록/상세/상태 변경
- 게시물/신고: 토크, 후기, 평가, 채팅 신고 목록/상세/처리
- 회원: 목록/상세, 상담/활동/신고/이벤트/리얼모델 실데이터 연결

### 4.4 `hooks/common/`

도메인 이름 없이 설명 가능한 hook만 둔다.

현재 주요 파일:

- `useListData.ts`: 목록 fetch lifecycle 공통화
- `useCategorySelectorLoader.ts`: 공통 카테고리 selector 로드
- `useDaumPostcode.ts`: 주소 검색
- `useFormFieldFocus.ts`: validation field focus
- `useObjectUrl.ts`: object URL 생성/해제
- `useGoBack.ts`: 상세/수정 뒤로가기

도메인 endpoint나 field key를 알면 `hooks/common`이 아니다.

### 4.5 도메인 hook

도메인 endpoint, field key, DOM target을 아는 hook은 도메인 폴더에 둔다.

예:

- `hooks/hospital/useHospitalAddressSearch.ts`
- `hooks/hospital/useHospitalFeatureList.ts`
- `hooks/hospital/useHospitalFieldFocus.ts`
- `hooks/doctor/useDoctorHospitalOptions.ts`
- `hooks/doctor/useDoctorMediaState.ts`
- `hooks/hospital-event/useHospitalEventMediaState.ts`
- `hooks/video/useVideoHospitalOptions.ts`
- `hooks/video/useVideoDoctorOptions.ts`

### 4.6 `lib/common/`

`staff-web` 전체 공통 순수 함수, 설정, 세션, 라우팅 규칙을 둔다.

현재 주요 파일:

- `api.ts`: staff API client
- `auth/session.ts`: login / restoreSession / ensureSession / logout
- `routing/route-permissions.ts`: 정적/동적 route permission 단일 소스
- `routing/admin-pages.tsx`: placeholder 페이지 metadata/렌더 정의
- `routing/page-header-extra.tsx`: 페이지 header action 주입
- `navigation/buildReturnToPath.ts`: list/detail/form 복귀 경로 조립
- `request-cache.ts`: 짧은 TTL request cache
- `media.ts`, `media-validation.ts`: 미디어 타입/검증 공통 helper
- `content-report.ts`, `review-status.ts`, `visibility-row.ts`: staff 공통 표시/상태 helper

### 4.7 도메인 lib

도메인별 `form.ts`, `list.ts`, `detail.ts`는 타입, 초기값, validation, mapper, query builder, formatter만 가진다.

규칙:

- React state, router, modal, API submit orchestration은 넣지 않는다.
- DTO 응답을 그대로 들고 다니지 않고 화면 shape로 normalize한다.
- form payload/FormData 생성은 가능한 한 도메인 lib의 pure helper로 둔다.
- 목록 query parse/build와 row mapper는 `lib/{domain}/list.ts`에 둔다.

## 5. 목록 패턴

목록 화면은 URL query를 상태의 단일 기준으로 사용한다.

흐름:

1. URL query parse
2. draft filter와 applied query 분리
3. `useListData` 또는 동일한 fetch lifecycle로 중복 fetch 방지
4. summary/list/options는 의존성이 없으면 병렬 호출
5. API 응답을 도메인 `list.ts`에서 row로 normalize
6. 상세 진입 시 `returnTo` 유지
7. 등록/수정 후 `highlight`로 행 강조

공통 원칙:

- 검색어 입력마다 API를 호출하지 않는다.
- table 렌더를 이미지 preload가 막지 않는다.
- 같은 option API는 `request-cache.ts` 또는 상위 상태로 중복 호출을 줄인다.
- load error UI는 `LoadErrorState`를 사용한다. 흰 박스/취소 버튼 없이 문구와 다시 불러오기만 중앙 배치한다.

## 6. 폼 패턴

폼은 다음 책임을 분리한다.

| 위치                                           | 책임                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `page.tsx`                                     | metadata, params 전달, Client 렌더                                   |
| `*CreateFormClient.tsx`, `*EditFormClient.tsx` | 초기 로드, form state 조립, submit 호출, 성공 후 이동, header action |
| `lib/{domain}/form.ts`                         | 타입, 초기값, validation, normalize, payload builder                 |
| `components/{domain}/form/*Section.tsx`        | 섹션 UI 렌더링                                                       |
| `hooks/{domain}/use*MediaState.ts`             | create/edit 반복 미디어 상태                                         |

Submit 순서:

```text
validate -> payload build -> api call -> success/error handling
```

Validation 규칙:

- validation은 side effect 없는 pure function이다.
- error key는 form field key와 일치시킨다.
- UI 컴포넌트에서 필수 문구를 임의로 만들지 않는다.
- 첫 번째 에러 필드로 스크롤/포커스를 보낸다.

## 7. 미디어 계약

- 수정 폼의 미디어 payload는 최종 상태 기준으로 전송한다.
- 단일 파일은 `existing_*_id`와 선택적인 새 파일을 함께 사용한다.
- 다중 파일은 `existing_*_ids[]`와 새 파일 배열을 함께 사용한다.
- 기존/신규 다중 파일을 섞어 정렬해야 하면 `gallery_order[]` 같은 명시적 순서 payload를 사용한다.
- 병의원 갤러리는 `existing:{id}` / `new:{index}` 토큰 기반 `gallery_order[]`를 사용한다.
- 동영상 원본 파일은 staff가 교체하지 않고 삭제만 할 수 있으므로 `remove_video_file`을 사용한다.
- object URL 생성/해제는 `useObjectUrl`을 사용한다.
- 원본보기/미리보기/다운로드 문구는 도메인별로 새로 만들지 않고 공통 용어를 우선 사용한다.

## 8. 권한/메뉴/세션

현재 보호 흐름:

- `lib/common/auth/session.ts`: 세션 저장/복구
- `lib/common/routing/route-permissions.ts`: route permission source
- `components/common/guard.tsx`: 미인증/미권한 접근 처리
- `components/common/sidebar-menu.tsx`: 권한 기반 메뉴 필터링
- `app/(admin)/layout.tsx`: 병의원/뷰티 도메인 toggle과 shell

규칙:

- 메뉴 노출과 route 보호는 같은 permission source를 공유한다.
- 신규 route는 fail-closed가 기본이다. 권한 매핑이 없으면 접근 불가가 맞다.
- placeholder 페이지도 노출한다면 권한 매핑을 가져야 한다.
- 프론트 권한은 UX 제어이고, 서버 권한 검증을 대체하지 않는다.

## 9. 포맷/검증 명령

루트 `package.json` 기준:

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Prettier 설정:

- `.prettierrc.json`
- `prettier-plugin-tailwindcss`
- `printWidth: 120`
- `singleQuote: false`
- `endOfLine: auto`

문서/코드 변경 후 최소 `pnpm format:check`, `pnpm lint`, `pnpm typecheck`를 확인한다. 배포 전에는 `pnpm build`까지 확인한다.

## 10. 관련 문서

- [Staff Web Rules](/root/beaulab_frontend/doc/staff-web-rules.md)
- [TODO](/root/beaulab_frontend/doc/todo.md)
- [Root README](/root/beaulab_frontend/README.md)
