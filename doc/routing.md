# Frontend Routing And Permissions

작성 기준: 2026-07-27

이 문서는 `apps/staff-web`의 route, 메뉴, 권한 기준이다.

## 1. Route group

`apps/staff-web/app/(admin)/(pages)` 아래 route group은 세 개만 사용한다.

- `(common)`
- `(hospital)`
- `(beauty)`

기능별 route group을 추가하지 않는다.

## 2. URL prefix

프론트 URL은 API 리소스명이 아니라 관리자 메뉴 상위 그룹 기준으로 정한다.

| Prefix                     | 메뉴 영역                |
| -------------------------- | ------------------------ |
| `/hospital-dashboard`      | 병의원 대시보드          |
| `/hospital-manage`         | 병의원, 의료진, 입점신청 |
| `/wallet-manage`           | 충전금                   |
| `/customer-db-manage`      | 이벤트 DB, 리얼모델 DB   |
| `/ads-manage`              | 이벤트/광고              |
| `/video-manage`            | 동영상                   |
| `/post-manage`             | 게시물                   |
| `/reported-post-manage`    | 신고게시물               |
| `/notice-manage`           | 공지사항                 |
| `/content-manage`          | 컨텐츠                   |
| `/category-hashtag-manage` | 카테고리/해시태그        |
| `/statistics-manage`       | 통계                     |
| `/admin-settings`          | 관리자 설정              |
| `/beauty-*`                | 뷰티 영역 placeholder    |

예외:

- 프론트 URL `/ads-manage/events`
- 백엔드 API `/api/v1/staff/hospital-events`

이 둘은 다를 수 있다. URL은 메뉴 기준, API는 백엔드 리소스 기준이다.

## 3. 메뉴 구조

메뉴는 `apps/staff-web/components/common/sidebar-menu.tsx`가 소유한다.

기준:

- 병의원/뷰티 도메인 토글을 유지한다.
- 공통메뉴라는 별도 그룹은 사용하지 않는다.
- 모든 메뉴는 상위 메뉴 아래 2depth 구조를 기본으로 한다.
- placeholder도 향후 개발 대상이면 메뉴 껍데기를 남긴다.
- 메뉴 노출 권한은 route permission helper를 통해 가져온다.

메뉴에 노출되지 않아도 권한 매핑이 필요한 route가 있다.

| Route                               | 이유                                                               |
| ----------------------------------- | ------------------------------------------------------------------ |
| `/admin-settings/profile`           | header 사용자 메뉴에서 진입하는 내 프로필 화면                     |
| `/category-hashtag-manage/hashtags` | `/content-manage/hashtags`로 보내는 legacy redirect route          |
| `/hospital-dashboard/dashboard`     | 현재 메뉴에는 없지만 route placeholder가 남아 있는 병의원 대시보드 |
| `/beauty-dashboard/dashboard`       | 현재 메뉴에는 없지만 route placeholder가 남아 있는 뷰티 대시보드   |
| `/ads-manage/products`              | 현재 메뉴에는 없지만 이벤트/광고 placeholder route                 |
| `/content-manage/popups`            | `배너 / 팝업` 메뉴와 별도로 남아 있는 팝업 placeholder route       |
| `/beauty-post-manage/talks`         | 현재 메뉴에는 없지만 뷰티 게시물 placeholder route                 |

## 4. 권한 단일 소스

route 권한은 `apps/staff-web/lib/common/routing/route-permissions.ts`가 단일 소스다.

구성:

- `STATIC_ADMIN_ROUTE_PERMISSIONS`: 정적 route 권한
- `ADMIN_ROUTE_PERMISSION_RULES`: 동적 route 포함 전체 권한 rule
- `resolveRoutePermissionRule`: 현재 pathname과 가장 구체적인 rule 매칭
- `resolveRoutePermissions`: 필요한 permission 배열 반환

신규 route 추가 순서:

1. 실제 page route 추가
2. `route-permissions.ts`에 권한 추가
3. sidebar 메뉴가 필요하면 `sidebar-menu.tsx`에 추가
4. 접근 가능/불가 계정으로 guard 확인

## 5. Fail-closed

신규 관리자 route는 fail-closed가 기본이다.

의미:

- 권한 매핑이 없으면 접근 불가가 맞다.
- 메뉴에만 숨기는 것은 권한 보호가 아니다.
- 서버 권한 검증이 최종 기준이고, 프론트 권한은 UX 보호다.

## 6. returnTo / highlight

목록에서 상세/수정으로 이동할 때 현재 목록 문맥을 `returnTo`로 보존한다.

등록/수정 후 목록 복귀 시 변경된 행은 `highlight` query로 강조한다.

기준:

- 목록 필터/검색/페이지를 잃지 않는다.
- 취소 버튼과 뒤로가기 버튼도 같은 문맥으로 돌아간다.
- 취소 후에는 등록/수정 highlight를 만들지 않는다.

## 7. 에러 페이지

공통 400번대 에러 화면은 `packages/ui-admin`의 `ErrorStatusPage`를 사용한다.

기준:

- 404, 419, 429처럼 상태 코드와 문구만 다른 화면은 같은 컴포넌트를 사용한다.
- auth 화면의 우측 브랜드 영역을 에러 페이지에 반복하지 않는다.
- 버튼이 필요 없는 오류는 버튼을 노출하지 않는다.
