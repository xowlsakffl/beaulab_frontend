# Frontend Architecture

이 문서는 Beaulab 프론트엔드 모노레포의 전체 구조, 계층 분리 원칙,  
Actor 기반 설계, 인증 및 권한 처리 전략을 정의합니다.

본 프론트엔드는 **Laravel API-only 서버 구조**를 전제로 설계되었습니다.

작성 기준: 2026-02-12
작성자: 안민성
---

# 1. 전체 구조

apps/
    staff-web/
    partner-web/
    user-web/
    mobile/

packages/
    api-client/
    auth/
    types/
    ui-admin/

doc/
    architecture.md

---

# 2. 설계 철학

## 2.1 API-Only 전제

- Laravel은 상태 없는 JSON API 서버입니다.
- 모든 응답은 ApiResponse<T> 포맷을 따릅니다.
- 프론트는 서버 세션을 신뢰하지 않습니다.
- 인증은 토큰 기반(stateless)입니다.
- HTTP status 코드가 아닌 success 필드로 성공/실패를 판단합니다.

---

## 2.2 Actor 기반 분리

프론트도 백엔드와 동일하게 Actor 기준으로 분리합니다.

- staff-web → /api/v1/staff/*
- partner-web → /api/v1/partner/*
- user-web → /api/v1/user/*

각 앱은 다른 Actor API를 호출하지 않습니다.

Actor는 다음을 모두 결정합니다:
- baseURL
- token 저장 키
- session 저장 키
- profile 타입

---

# 3. 계층 구조

UI Layer (apps/*)
↓
Shared Layer (packages/*)
↓
Laravel API Server

원칙
- UI는 직접 fetch 하지 않습니다.
- API는 api-client를 통해서만 호출합니다.
- 토큰/세션은 auth 패키지를 통해서만 접근합니다.
- 권한 제어는 permission helper를 통해 수행합니다.
---

# 4. Packages 책임 분리

## 4.1 types

역할:
- ApiResponse<T>
- ErrorCode
- ActorType
- ActorSession<TProfile>
- StaffSession / PartnerSession / UserSession
- Domain DTO 타입

규칙:
- Runtime 로직 금지
- fetch 금지
- localStorage 금지
- React import 금지
- 상태 관리 금지

---

## 4.2 auth

역할:
- tokenStorage
- sessionStorage
- hasPermission()
- hasAnyPermission()
- hasAllPermissions()
- 세션 타입 기반 UX 제어

규칙:
- API 호출 금지
- 라우팅 금지
- UI 의존 금지
- fetch 금지

---

## 4.3 api-client

역할:
- fetch 래퍼
- Authorization 헤더 자동 첨부
- query 직렬화(buildUrl)
- JSON body 자동 처리
- ApiResponse<T> 반환

내부 핵심 파일:
- client.ts
- url.ts

규칙:
- next/router 사용 금지
- localStorage 직접 접근 금지 (auth 통해서만)
- UI 로직 포함 금지
- React import 금지

---

## 4.4 ui-admin

역할:
- TailAdmin 기반 Layout
- Sidebar
- UI 컴포넌트
- 디자인 시스템

규칙:
- API 로직 금지
- auth 로직 금지
- 토큰 처리 금지
- 권한 로직 포함 금지

---
# 5. 각 앱 내부 구조 표준
``` text
staff-web/
  app/                ← 화면 (App Router)
  components/         ← UI 컴포넌트
  hooks/
  lib/
    api.ts            ← actor client 싱글톤
    session.ts        ← login/restore/logout
    services/
      *.service.ts    ← 도메인별 API 로직
```
# 6. 로그인 및 세션 흐름

1. POST /api/v1/{actor}/auth/login
2. token 저장
3. GET /api/v1/{actor}/profile
4. profile + roles + permissions 저장
5. 보호 영역 진입

## 6.1 세션 구조
```text
{
  actor: "staff",
  profile: {...},
  auth: {
    roles: [],
    permissions: [],
    scope?: string
  }
}
```
---

# 7. 보호 전략

## 7.1 프론트 보호 (UX)

- (admin) layout에서 token 검사
- token 없으면 login 이동
- profile API 실패 시 logout

## 7.2 서버 보호 (보안)

- Sanctum 인증
- Permission 기반 접근 제어
- Scope 기반 데이터 범위 제한

프론트는 보안을 담당하지 않습니다.
프론트의 권한 제어는 UX 목적입니다.

---

# 8. 권한 모델

- 기능 접근 제어는 Permission 기준
- Role 직접 분기 금지
- Scope는 서버 정책에서 강제
- 메뉴 노출은 requiredPermissions 기준

예:

hasPermission("beaulab.hospital.delete")

---

# 9. 에러 처리 전략

- 모든 API는 ApiResponse 포맷
- success: true | false
- 실패 시 error.code, error.message
- traceId는 UI에 표시 가능
- 운영 이슈는 traceId 기준 추적

---

# 10. 확장 전략

- 새로운 Actor 추가 시 apps에 앱 추가
- packages는 그대로 재사용
- mobile 앱도 동일 API 계약 사용
- 권한 확장은 Permission 문자열 추가 방식으로 확장
- Scope 추가는 서버 정책에서 확장

---

# 11. 유지보수 원칙

- 비즈니스 로직은 apps 내부 feature 단위로 구성
- 공통 로직은 packages로 이동
- 순환 의존 금지
- Actor 간 API 혼용 금지
- fetch 직접 사용 금지
- localStorage 직접 사용 금지
- success 체크 없는 API 사용 금지

---

# 12. 핵심 원칙 요약
12. 핵심 원칙 요약
- 프론트는 다음 4가지를 절대 위반하지 않습니다:
- API는 api-client를 통해서만 호출한다.
- 토큰/세션은 auth를 통해서만 접근한다.
- 권한은 permission helper를 통해서만 검사한다.
- 모든 응답은 ApiResponse 계약을 따른다.