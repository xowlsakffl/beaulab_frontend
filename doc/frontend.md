# Frontend 유지보수 가이드 (Beaulab)

이 문서는 Beaulab 프로젝트의 **Frontend (Web / Mobile)** 유지보수 시  
구조 이해, 변경 영향도 판단, 작업 순서 정리를 위한 가이드입니다.

본 프로젝트는 **Laravel API 서버와 완전히 분리된 Frontend 구조**를 전제로 합니다.

---

# 1. 전체 아키텍처 개요

## 핵심 원칙

- 프론트엔드는 **Laravel API와 완전 분리**
- 인증은 **Sanctum 토큰 기반**
- 권한은 서버가 판단, 프론트는 표시 제어만 수행
- UI 시스템은 **User / Admin 계열 완전 분리**
- Admin UI는 **공통 패키지(ui-admin) 기반**
- Partner / Staff는 UI를 공유하되, **메뉴/권한은 각 앱에서 정의**

---

# 2. 모노레포 구조

```text
frontend/
├─ apps/
│  ├─ user-web/        # 사용자 서비스 (커스텀 UI)
│  ├─ partner-web/     # 파트너 어드민 (TailAdmin 기반)
│  └─ staff-web/       # 내부 직원 어드민 (TailAdmin 공유)
│
├─ packages/
│  ├─ ui-admin/        # TailAdmin 기반 공용 Layout / Sidebar / Header
│  ├─ api-client/      # API 통신 규칙 (fetch/axios 래핑)
│  ├─ auth/            # 인증 / 권한 헬퍼
│  └─ types/           # DTO / 공통 타입 정의
```

## 2.1 apps/*

- 실제 실행되는 서비스 단위 애플리케이션
- 각각 독립적으로 `dev / build / deploy` 가능해야 한다
- Next.js(App Router) 기반으로 구성
- 각 앱은 자체 라우팅, 페이지, 도메인 구조를 가진다
- 앱 간 직접 의존은 금지한다

### 포함되는 항목

- `app/` (라우트 및 페이지)
- `components/` (앱 전용 UI)
- `features/` (도메인 단위 구성)
- `layouts/` (앱 전용 레이아웃)
- `hooks/`
- `stores/`
- `public/`

### 금지 사항

- 다른 앱의 코드 직접 import 금지
- 공용화 가능한 로직을 앱 내부에 중복 구현 금지

> 공통화 필요 시 반드시 `packages/*`로 이동

---

## 2.2 packages/*

- 여러 앱에서 공유하는 공용 레이어
- UI / 로직 / 타입 정의를 포함
- 독립적인 실행 단위가 아니다
- apps에서만 의존 가능

### 주요 패키지 역할

#### ui-admin
- TailAdmin 기반 공통 Layout
- Sidebar / Header
- 공통 Modal / Overlay
- Admin 전용 UI 시스템

#### api-client
- API 호출 규칙 통합
- fetch / axios 래퍼
- 토큰 자동 주입 처리

#### auth
- 인증 상태 관리
- Permission 헬퍼
- 로그인 / 로그아웃 처리

#### types
- DTO 정의
- 공통 인터페이스
- API 응답 타입 정의

---

## 3. UI 시스템 분리 원칙

### 3.1 User Web

- 완전 독립 UI 시스템
- TailAdmin 사용 금지
- ui-admin 패키지 의존 금지
- 사용자 경험 중심 설계

### 3.2 Partner / Staff Web

- TailAdmin 기반 UI 공유
- `packages/ui-admin`을 통해 Layout 사용
- 메뉴 정의는 각 앱에서 수행
- 권한 분기는 Permission 기반으로 처리

---

## 4. 의존성 방향 원칙

### 허용
apps → packages

### 금지
packages → apps
apps ↔ apps


- 순환 의존 금지
- 앱 간 직접 import 금지

---

## 5. 레이어 책임 분리

### 페이지 (app/)

- 화면 조합
- API 호출
- 권한 체크
- 상태 연결

### feature/

- 도메인 단위 UI 묶음
- 페이지에서 재사용 가능

### packages/ui-admin

- Layout 시스템
- Sidebar 구조
- 공통 UI 프리미티브

---

## 6. 레이아웃 유지 원칙

- Header / Sidebar는 고정
- 페이지 이동 시 Layout은 리마운트되지 않는다
- 변경되는 영역은 Content만
- Layout 구조 수정은 ui-admin에서만 수행한다

---

## 7. 권한 처리 원칙

- 서버가 최종 권한 판단
- 프론트는 Permission 기반 UI 분기만 수행
- 메뉴 노출은 UX 목적
- 실제 보안은 API에서 강제

---

## 8. 상태 관리 원칙

- 전역 상태 최소화
- 인증 정보만 글로벌 관리
- 필터/정렬은 URL 기반 관리
- UI 상태는 로컬 state 우선

---

## 9. 변경 영향도 기준

### High Impact

- Layout 변경
- Sidebar / Header 변경
- ui-admin 수정

### Medium

- 공통 컴포넌트 수정
- 네비게이션 로직 변경

### Low

- 단일 페이지 수정
- 도메인 전용 UI 수정
