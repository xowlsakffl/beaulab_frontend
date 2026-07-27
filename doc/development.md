# Frontend Development

작성 기준: 2026-07-27

이 문서는 프론트엔드 개발 실행과 검증 기준이다.

## 1. 런타임

프론트엔드는 pnpm workspace와 Turborepo를 사용한다.

```text
beaulab_frontend/
├─ apps/
│  ├─ staff-web
│  └─ user-web
├─ packages/
│  ├─ api-client
│  ├─ auth
│  ├─ types
│  └─ ui-admin
└─ doc
```

루트 패키지 기준:

- package manager: `pnpm@10.29.2`
- framework: Next.js App Router
- formatter: Prettier
- Tailwind class 정렬: `prettier-plugin-tailwindcss`

## 2. 실행 명령

루트에서 실행한다.

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
```

특정 앱만 실행할 때는 workspace filter를 사용한다.

```bash
pnpm --filter staff-web dev
pnpm --filter user-web dev
```

## 3. 검증 기준

문서만 수정한 경우:

```bash
pnpm exec prettier --check doc README.md AGENTS.md
```

프론트 코드 수정 시 최소 기준:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
```

배포 전 기준:

```bash
pnpm build
```

## 4. 환경 변수

`apps/staff-web`는 staff API base URL로 `NEXT_PUBLIC_API_URL`을 사용한다.

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

staff API client는 내부적으로 `/api/v1/staff`를 붙인다. 화면 코드에서 API host를 직접 조합하지 않는다.

## 5. 작업 순서

1. 관련 문서를 먼저 확인한다.
2. 기존 도메인 패턴을 찾는다.
3. 문서와 다른 구현이 필요하면 문서를 먼저 갱신한다.
4. 코드를 수정한다.
5. 포맷, lint, typecheck를 확인한다.

## 6. 금지

- `packages/*`에 staff 도메인 업무 로직을 넣지 않는다.
- `app/page.tsx`에 API 호출, validation, submit 흐름을 넣지 않는다.
- 브라우저 `alert()`를 새로 추가하지 않는다.
- 새 route를 권한 매핑 없이 추가하지 않는다.
- 검색 입력마다 목록 API를 호출하지 않는다.
