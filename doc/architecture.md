# Frontend Architecture

이 문서는 현재 Beaulab 프론트엔드 모노레포의 실제 구조와 운영 규칙을 정의합니다.

작성 기준: 2026-03-17

## 1. 현재 상태

현재 레포에 구현된 앱은 `apps/staff-web`입니다.  
`packages/*`는 공통 레이어이며, 실제 업무 모듈은 앱 내부에 둡니다.

```text
apps/
  staff-web/

packages/
  api-client/
  auth/
  types/
  ui-admin/
```

미래에 다른 actor 앱을 추가할 수는 있지만, 문서에는 구현된 구조만 사실로 적습니다.

## 2. 설계 원칙

### 2.1 계층

```text
apps/*            -> 실제 제품, 실제 actor, 실제 feature
packages/*        -> 공통 UI/타입/인증/HTTP 기반
Laravel API       -> 도메인 데이터와 보안 정책의 원천
```

### 2.2 핵심 규칙

- 앱은 공통 패키지를 조합하지만, 공통 패키지가 앱을 알면 안 됩니다.
- 도메인 규칙, 메뉴 구성, 라우트 권한, actor별 흐름은 `apps/*`에 둡니다.
- 공통 패키지에는 앱 전용 경로, 더미 사용자, 고정 알림 데이터, 하드코딩된 logo 계약을 넣지 않습니다.
- 패키지 간 참조는 `@beaulab/*` workspace 의존성으로만 연결합니다.

## 3. Packages 책임

### 3.1 `@beaulab/types`

역할:

- `ApiResponse<T>`
- actor/session/profile 타입
- 공통 DTO 타입

규칙:

- 런타임 상태 금지
- `fetch` 금지
- `localStorage` 금지
- React 의존 금지

### 3.2 `@beaulab/auth`

역할:

- token storage
- session storage
- `hasPermission`
- `hasAnyPermission`
- `hasAllPermissions`

규칙:

- API 호출 금지
- 라우팅 금지
- UI 의존 금지

### 3.3 `@beaulab/api-client`

역할:

- `fetch` 래퍼
- Authorization 헤더 주입
- query 직렬화
- JSON/FormData 처리
- `ApiResponse<T>` 반환

규칙:

- `next/navigation` 금지
- UI 로직 금지
- storage 직접 접근 금지
  - token 조회는 `@beaulab/auth`를 통해서만 수행

### 3.4 `@beaulab/ui-admin`

역할:

- 공용 관리자 레이아웃
- 공용 UI 컴포넌트
- 입력, 테이블, 드롭다운 등 재사용 UI

규칙:

- API 로직 금지
- auth 로직 금지
- permission 로직 금지
- 앱 전용 라우트 하드코딩 금지
- 앱 전용 asset 경로 강제 금지
- fake user / fake notification 데이터 포함 금지

`ui-admin`은 shell과 presentational UI만 제공합니다.  
실제 메뉴, 사용자 메뉴, 브랜드 로고, 라우트 이동은 앱이 주입합니다.

## 4. `apps/staff-web` 책임

`staff-web`는 실제 스태프 관리자 제품입니다.

소유 범위:

- App Router 페이지
- feature module
- route-permission 규칙
- actor 세션 복구
- staff API 조합
- `ui-admin`에 주입할 브랜드/메뉴/사용자 정보

권장 구조:

```text
apps/staff-web/
  app/                    # 페이지와 레이아웃
  components/             # 앱 전용 UI와 adapter
  lib/
    api.ts                # staff client
    session.ts            # login/restore/logout
    route-permissions.ts  # route별 permission 규칙
```

## 5. 로그인과 세션

흐름:

1. `POST /api/v1/staff/auth/login`
2. token 저장
3. `GET /api/v1/staff/profile`
4. profile, roles, permissions 저장
5. 보호 라우트 진입

세션 예시:

```text
{
  actor: "staff",
  profile: {
    id: 1,
    name: "홍길동",
    nickname: "admin"
  },
  auth: {
    roles: ["staff.admin"],
    permissions: ["beaulab.hospital.show"]
  }
}
```

## 6. 권한 처리

- 서버 보안은 서버가 책임집니다.
- 프론트 권한 처리는 UX 제어 목적입니다.
- 메뉴 노출과 화면 접근은 permission 기준으로 처리합니다.
- role 직접 분기는 지양합니다.

현재 staff 앱은 다음 두 축으로 권한을 다룹니다.

- 메뉴 노출: `components/admin/sidebar-menu.tsx`
- 라우트 접근: `lib/route-permissions.ts`

둘은 같은 permission 모델을 공유해야 하며, 서로 다른 의미를 가지면 안 됩니다.

## 7. Shared Package 이동 기준

다음 조건을 만족할 때만 `apps/*` 코드를 `packages/*`로 이동합니다.

- 두 개 이상 앱에서 실제로 재사용된다.
- actor나 도메인 이름 없이 설명 가능하다.
- 앱별 메뉴/라우트/세션 없이 props만으로 제어 가능하다.
- 이동 후에도 API/auth/business rule이 섞이지 않는다.

위 조건을 만족하지 않으면 앱에 둡니다.

## 8. 금지 사항

- `packages/*`에서 sibling 폴더 상대경로 import
- `ui-admin`에서 `/profile`, `/signin` 같은 앱 전용 경로 하드코딩
- `ui-admin`에서 더미 사용자나 알림 데이터를 기본값으로 제공
- 앱에서 직접 `fetch` 호출
- `ApiResponse` success 체크 없는 사용
- route permission과 sidebar permission 불일치

## 9. 검증 기준

루트 기준으로 아래 명령이 모두 통과해야 합니다.

```bash
pnpm typecheck
pnpm lint
pnpm build
```

이 세 가지가 깨지면 구조 문서는 신뢰할 수 없습니다.
