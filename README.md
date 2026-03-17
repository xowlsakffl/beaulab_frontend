# Beaulab Frontend Monorepo

Beaulab 프론트엔드 모노레포입니다.

현재 레포의 실제 운영 대상 앱은 `apps/staff-web` 하나입니다.  
`packages/*`는 공통 레이어이고, 실제 업무 모듈과 actor 조합은 각 `apps/*`가 소유합니다.

## 기술 스택

- `pnpm workspace`
- `Turborepo`
- `Next.js App Router`
- `TypeScript`
- `Tailwind CSS`

## 현재 구조

```text
beaulab_frontend/
├─ apps/
│  └─ staff-web/            # 실제 관리자 앱
├─ packages/
│  ├─ api-client/           # fetch 래퍼, actor별 HTTP 클라이언트 기반
│  ├─ auth/                 # token/session storage, permission helper
│  ├─ types/                # ApiResponse, session/profile 타입
│  └─ ui-admin/             # 공용 관리자 UI, 레이아웃, 입력/테이블 컴포넌트
└─ doc/
   └─ architecture.md
```

## 책임 분리

- `apps/staff-web`
  - 실제 화면, 라우팅, feature module, actor 세션 흐름을 관리합니다.
  - `packages/*`를 조합해서 staff 관리자 앱을 완성합니다.
- `packages/ui-admin`
  - 순수 UI와 레이아웃만 담당합니다.
  - 앱 전용 라우트, asset 경로, 사용자 데이터, 인증 로직을 가지면 안 됩니다.
- `packages/api-client`
  - HTTP 요청과 공통 응답 처리만 담당합니다.
- `packages/auth`
  - token/session 저장과 permission helper만 담당합니다.
- `packages/types`
  - 런타임 없는 공통 타입만 담당합니다.

## 워크스페이스 규칙

- `apps/*`는 `packages/*`를 의존할 수 있습니다.
- `packages/*`는 서로 의존할 수 있지만 순환 의존은 금지합니다.
- 패키지 간 참조는 상대경로 대신 `@beaulab/*` workspace 의존성을 사용합니다.
- `packages/*`는 특정 actor나 특정 앱의 업무 규칙을 가지면 안 됩니다.
- 실제 도메인 정책, 메뉴 조합, route-permission 매핑은 앱에서 정의합니다.

## 실행

의존성 설치:

```bash
pnpm install
```

개발 서버:

```bash
pnpm --filter staff-web dev
```

전체 검증:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## 인증 흐름

1. `POST /api/v1/staff/auth/login`
2. token 저장
3. `GET /api/v1/staff/profile`
4. profile, roles, permissions를 세션으로 복구
5. 보호 영역 진입

## 문서

- [아키텍처 문서](/root/beaulab_frontend/doc/architecture.md)
