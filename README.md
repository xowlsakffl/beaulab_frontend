# Beaulab Frontend Monorepo

Beaulab 프로젝트의 프론트엔드 모노레포입니다.

본 레포는 **Laravel API 서버(API-only)** 구조를 전제로 하며,  
Actor(Staff / Partner / User) 기반으로 앱을 분리하고  
공통 로직은 `packages/`에서 관리합니다.

---

# 1. 기술 스택

- pnpm (workspace)
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- TailAdmin (UI)
- Fetch 기반 API Client

---

# 2. 모노레포 구조

``` text
frontend/
├─ apps/
│ ├─ user-web/ # 사용자 서비스 (Custom UI)
│ ├─ partner-web/ # 파트너 어드민 (TailAdmin 기반)
│ └─ staff-web/ # 내부 직원 어드민 (TailAdmin 공유)
│
├─ packages/
│ ├─ ui-admin/ # Admin 공용 Layout / Sidebar / Header
│ ├─ api-client/ # API 통신 래퍼
│ ├─ auth/ # 인증 / 권한 헬퍼
│ └─ types/ # DTO / 공통 타입
├─ doc/ 문서
```
---

## 3. pnpm Workspace 설정

### 3.1 pnpm 설치

Node 18 이상을 권장합니다.

전역에 pnpm이 없다면 다음 명령으로 설치합니다.

npm install -g pnpm

---

### 3.2 의존성 설치

루트 디렉토리에서 실행합니다.

pnpm install

이 명령은 다음을 모두 설치합니다:

- apps/*
- packages/*

모든 workspace 의존성을 한 번에 설치합니다.

---

### 3.3 특정 앱 실행

예: staff-web 실행

pnpm --filter staff-web dev

다른 앱 실행 예시:

pnpm --filter partner-web dev  
pnpm --filter user-web dev

---

### 3.4 전체 빌드

루트에서 실행:

pnpm build

또는 특정 앱만:

pnpm --filter staff-web build

---

### 3.5 특정 패키지만 빌드

예: types 패키지만 빌드

pnpm --filter @beaulab/types build

---

## 4. Workspace 규칙

- apps/* → packages/* 의존 가능
- packages/* 간 순환 의존 금지
- types 패키지는 runtime 로직 금지
- ui-admin 패키지는 API / auth 로직 포함 금지
- api-client는 라우팅 로직 포함 금지
- auth는 HTTP 호출 금지

---

## 5. Actor 기반 분리

각 앱은 특정 Actor 전용입니다.

| App | API Prefix |
|------|------------|
| staff-web | /api/v1/staff/* |
| partner-web | /api/v1/partner/* |
| user-web | /api/v1/user/* |

각 앱은 다른 Actor API를 호출하지 않습니다.

---

## 6. 로그인 흐름

1. POST /api/v1/{actor}/auth/login
2. token 저장
3. GET /api/v1/{actor}/profile
4. profile + roles + permissions 저장
5. 보호 영역 진입

---

## 7. 권한 처리 원칙

- 메뉴 노출은 Permission 기준
- Role 직접 분기 금지
- 실제 보안은 서버에서 강제

---

## 8. 에러 처리

- 모든 API는 ApiResponse 포맷
- 실패 시 error.code 사용
- traceId는 UI에서 표시 가능
- 운영 이슈는 traceId 기준 추적

---

## 9. 문서
- [아키텍처 & 흐름](./doc/architecture.md)
