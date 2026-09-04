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

| Prefix                     | 메뉴 영역                 |
| -------------------------- | ------------------------- |
| `/hospital-dashboard`      | 병의원 대시보드           |
| `/hospital-manage`         | 병의원, 의료진, 입점신청  |
| `/wallet-manage`           | 충전금                    |
| `/customer-db-manage`      | 이벤트 DB, 리얼모델 DB    |
| `/ads-manage`              | 이벤트/광고               |
| `/video-manage`            | 동영상                    |
| `/post-manage`             | 게시물                    |
| `/reported-post-manage`    | 신고게시물                |
| `/notice-manage`           | 공지사항                  |
| `/content-manage`          | 이벤트 노출설정/정책 설정 |
| `/promotion-manage`        | 프로모션 상품             |
| `/category-hashtag-manage` | 카테고리/해시태그         |
| `/statistics-manage`       | 통계                      |
| `/admin-settings`          | 운영 관리/정책 설정       |
| `/beauty-*`                | 뷰티 영역 placeholder     |

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

병의원 메뉴 순서:

- 도메인 영역(`main`): 병의원 → 충전금 → 고객 DB → 이벤트/광고 → 동영상 → 게시물 → 신고게시물.
- 하단 영역(`others`): 회원 → 공지사항 → 프로모션 상품 → 이벤트 노출설정 → 통계 → 운영 관리 → 정책 설정.
- 두 영역 사이에는 실선 구분선만 표시하며 별도 공통메뉴 제목을 붙이지 않는다. 권한 필터링 후 한 영역만 남으면 구분선을 표시하지 않는다.
- 동영상 하위는 `영상 등록관리`, `영상 동의여부`이며 기존 동영상 목록 URL은 `/video-manage/videos`를 유지한다.
- 공지사항 메뉴에는 `전체공지`만 노출한다. 기존 FAQ·문의·병의원대상 공지 URL은 삭제하지 않는다.
- 운영 관리에는 직원 계정 관리, DB 단가비율 설정, 광고비율 설정을 배치하며 최고관리자 전용 permission으로 보호한다.
- 정책 설정에는 카테고리, 상단타이틀, 금지어 설정, 자동 닉네임 설정을 배치한다. 기존 해시태그 URL은 유지하되 메뉴에서 제외한다.
- 뷰티 영역은 뷰티샵 → 충전금 → 고객 DB → 광고 → 게시물 → 신고게시물 → 프로모션 상품 순서다. 공지사항 묶음은 노출하지 않는다.
- 영상 동의여부, 프로모션 상품, 기획전, 동영상 노출설정, DB 단가비율·광고비율 설정은 메뉴와 placeholder 페이지만 제공한다. 데이터 조회·변경 기능은 아직 구현하지 않는다.
- `main`이 비어 있어도 `others`에 접근 가능한 메뉴가 있으면 해당 도메인을 사용할 수 있어야 한다.

메뉴에 노출되지 않아도 권한 매핑이 필요한 route가 있다.

| Route                                                                                | 이유                                                               |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `/admin-settings/profile`                                                            | header 사용자 메뉴에서 진입하는 내 프로필 화면                     |
| `/category-hashtag-manage/hashtags`                                                  | `/content-manage/hashtags`로 보내는 legacy redirect route          |
| `/hospital-dashboard/dashboard`                                                      | 현재 메뉴에는 없지만 route placeholder가 남아 있는 병의원 대시보드 |
| `/beauty-dashboard/dashboard`                                                        | 현재 메뉴에는 없지만 route placeholder가 남아 있는 뷰티 대시보드   |
| `/ads-manage/products`                                                               | 현재 메뉴에는 없지만 이벤트/광고 placeholder route                 |
| `/content-manage/hashtags`                                                           | 정책 설정 메뉴 재배치 후 직접 접근만 유지하는 해시태그 화면        |
| `/notice-manage/hospital-notices`, `/notice-manage/faqs`, `/notice-manage/inquiries` | 전체공지로 메뉴 정리 후 남겨둔 placeholder route                   |
| `/beauty-notice-manage/*`                                                            | 뷰티 공지사항 메뉴 제거 후 남겨둔 placeholder route                |
| `/beauty-post-manage/talks`                                                          | 현재 메뉴에는 없지만 뷰티 게시물 placeholder route                 |

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
