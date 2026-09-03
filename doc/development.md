# Frontend Development

작성 기준: 2026-07-27

이 문서는 프론트엔드 개발 실행과 검증 기준이다.

## 1. 런타임

프론트엔드는 pnpm workspace와 Turborepo를 사용한다.

```text
beaulab_frontend/
├─ apps/
│  ├─ staff-web
│  ├─ hospital-web
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

루트 명령은 Turborepo 기준으로 전체 workspace를 대상으로 실행한다.

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
```

특정 앱/패키지만 실행할 때는 workspace filter를 사용한다.

```bash
pnpm --filter staff-web dev
pnpm --filter staff-web lint
pnpm --filter staff-web typecheck
pnpm --filter staff-web build

pnpm --filter hospital-web dev
pnpm --filter hospital-web lint
pnpm --filter hospital-web typecheck
pnpm --filter hospital-web build

pnpm --filter user-web dev

pnpm --filter @beaulab/ui-admin typecheck
```

작은 변경은 전체 `pnpm format`보다 변경 파일에만 `pnpm exec prettier --write <files...>`를 우선 사용한다.
불필요한 포맷 churn을 만들지 않기 위해서다.

## 3. 검증 기준

문서만 수정한 경우:

```bash
pnpm exec prettier --check doc README.md AGENTS.md
```

프론트 코드 수정 시 최소 기준:

```bash
pnpm exec prettier --check <changed-files...>
pnpm --filter staff-web lint
pnpm --filter staff-web typecheck
```

`packages/ui-admin`을 수정했거나 ui-admin export/type에 영향이 있으면 추가로 확인한다.

```bash
pnpm --filter @beaulab/ui-admin typecheck
```

공통 패키지 또는 여러 앱에 영향이 있으면 루트 기준으로 확인한다.

```bash
pnpm lint
pnpm typecheck
```

배포 전 기준:

```bash
pnpm build
```

## 4. 환경 변수

`apps/staff-web`는 staff API base URL로 `NEXT_PUBLIC_API_URL`을 사용한다.
`apps/hospital-web`도 같은 origin을 사용하고 내부적으로 `/api/v1/hospital`을 붙인다.

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_HOSPITAL_IDENTITY_VERIFICATION_URL=
```

staff API client는 내부적으로 `/api/v1/staff`를 붙인다. 화면 코드에서 API host를 직접 조합하지 않는다.

## 5. 작업 순서

1. 관련 문서를 먼저 확인한다.
2. 기존 도메인 패턴을 찾는다.
3. 문서와 다른 구현이 필요하면 문서를 먼저 갱신한다.
4. 코드를 수정한다.
5. 변경 범위에 맞는 포맷, lint, typecheck를 확인한다.

검색/점검 기준:

- `git grep` 또는 tracked source 기준 검색을 우선 사용한다.
- `.next`, `dist`, `build`, `node_modules` 같은 산출물은 검색 결과에서 제외한다.
- `.prettierignore` 기준으로 `public`, `apps/*/public`, `pnpm-lock.yaml`, 빌드 산출물은 포맷 대상에서 제외된다.

## 6. 금지

- `packages/*`에 staff 도메인 업무 로직을 넣지 않는다.
- `app/page.tsx`에 API 호출, validation, submit 흐름을 넣지 않는다.
- 브라우저 `alert()`를 새로 추가하지 않는다.
- 새 route를 권한 매핑 없이 추가하지 않는다.
- 검색 입력마다 목록 API를 호출하지 않는다.
