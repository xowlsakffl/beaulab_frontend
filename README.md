# 뷰랩 프론트엔드

성형·뷰티 플랫폼 뷰랩의 관리자 프론트엔드 모노레포입니다. 기존 관리자와 운영 프로세스를 분석한 뒤 화면 흐름, 권한, API 계약과 공통 UI 기준을 재정의하고 Next.js 기반으로 리뉴얼했습니다.

현재 제품 구현의 중심은 내부 운영자용 `staff-web`입니다. `user-web`은 향후 서비스 앱과 같은 사용자 기능을 제공할 웹 버전이며, 현재는 인증과 1:1 채팅·알림, Reverb 실시간 통신부터 구현돼 있습니다. `hospital-web`과 `beauty-web`은 각각 병원·뷰티 파트너가 사용하는 관리자 페이지로 구분하며 현재는 구현 예정 단계입니다. 서버 API와 도메인 규칙은 별도 [뷰랩 백엔드 저장소](https://github.com/xowlsakffl/beaulab_backend)에서 관리합니다.

## 담당 범위

- 기존 관리자 화면, 사용자별 운영 동선과 API 분석
- 요구사항, Information Architecture, 화면 흐름과 API 계약 정리
- Next.js 모노레포와 관리자 애플리케이션 구조 설계
- 병의원·의료진·이벤트·콘텐츠·신고·지갑 등 운영 화면 구현
- 공통 인증, API client, 타입과 관리자 UI 패키지 구성
- 백엔드 권한·상태 정의와 프론트 화면 동작의 기준 통일
- 배포 이후 실제 운영 피드백과 오류를 반영한 화면 개선

## 현재 앱 구성

| App | 경로 | 역할 | 현재 상태 |
| --- | --- | --- | --- |
| Staff Web | `apps/staff-web` | 내부 운영자 관리자 페이지 | 주요 운영 기능 구현 |
| User Web | `apps/user-web` | 사용자 서비스 앱의 웹 버전 | 인증·채팅·알림 우선 구현 |
| Hospital Web | `apps/hospital-web` 예정 | 병원 파트너 관리자 페이지 | 구현 예정 |
| Beauty Web | `apps/beauty-web` 예정 | 뷰티 파트너 관리자 페이지 | 구현 예정 |

라우트가 존재하더라도 내용이 placeholder인 Staff 화면은 아래 구현 범위에 포함하지 않습니다. Hospital Web과 Beauty Web은 제품 역할과 API 경계만 정의된 상태이며 현재 저장소에는 앱 디렉터리가 없습니다.

## 현재 구현 범위

### Staff Web

| 영역 | 주요 기능 |
| --- | --- |
| 인증·관리자 Shell | 로그인, 세션 복구, 로그아웃, 프로필, 권한 기반 메뉴·route guard, 병의원·뷰티 도메인 전환 |
| 병의원 운영 | 병의원·입점 신청, 의료진, 동영상 목록·상세·등록·수정, 검수·운영 상태 관리 |
| 이벤트·광고 | 이벤트 목록·상세·등록·수정, 이벤트 광고, 배치 캘린더, 신청 DB와 리얼모델 DB |
| 콘텐츠 운영 | 토크·댓글, 성형·시술 후기와 댓글, 병의원 평가, 영수증 검수 |
| 신고 운영 | 토크·후기·평가·채팅 신고 조회, 노출·경고·처리 상태 관리 |
| 공통 운영 | 공지사항, 일반 회원, 카테고리, 해시태그, 관리자 메모 |
| 지갑 | 병원별 잔액, 거래 내역, 환불·서비스 포인트와 알림 현황 |

관리자 화면은 목록에서 조건을 좁히고 상세에서 판단 근거와 이력을 확인한 뒤 수정·처리 결과를 남기는 실제 운영 순서를 기준으로 구현했습니다.

### User Web

- 일반 사용자 로그인과 세션 확인
- 사용자 간 1:1 채팅방·메시지 조회
- 텍스트·이미지·파일 메시지 전송
- 메시지 읽음 처리와 채팅방별 알림 설정
- 사용자 알림함, 미읽음 수, 단건·전체 읽음 처리
- Laravel Echo/Pusher를 이용한 Reverb private channel 이벤트 확인

`user-web`은 사용자 서비스 앱의 기능을 웹에서도 제공하기 위한 애플리케이션입니다. 현재는 서비스 전체 화면보다 로그인, 채팅, 읽음과 알림 같은 공통 커뮤니케이션 기능을 먼저 구현한 상태입니다.

## 프론트엔드 구조

### 앱과 공통 패키지 분리

```text
Page Route
  -> *Client.tsx
  -> domain mapper / validator / hook
  -> @beaulab/api-client
  -> Laravel API
  -> ApiResponse
  -> page state
```

- `apps/staff-web`: 관리자 제품 로직, route, 화면 상태와 도메인 UI
- `apps/user-web`: 사용자 서비스 웹, 현재 인증·채팅·알림 기능 구현
- `packages/api-client`: fetch wrapper, 인증 헤더, 공통 오류 처리
- `packages/auth`: Actor별 token·session과 permission helper
- `packages/types`: API와 공통 모델 타입
- `packages/ui-admin`: 앱·도메인에 의존하지 않는 관리자 UI

`packages/*`는 특정 Actor, route나 업무 도메인을 알지 않도록 유지합니다. 병원, 이벤트, 후기처럼 endpoint와 field에 묶인 로직은 `staff-web`의 도메인 폴더가 소유합니다.

### 화면 책임 분리

| 계층 | 책임 |
| --- | --- |
| App Route | App Router page, layout과 route group |
| Page Client | fetch, submit, redirect, loading·error state |
| Domain Component | section, table, filter, form, modal |
| Domain Hook·Lib | endpoint, validation, mapper, query helper |
| Staff Common | 인증 session, sidebar, guard, routing과 navigation |
| Workspace Package | 앱에 독립적인 HTTP, auth, type과 UI |

## 핵심 구현

### 1. 권한과 세션

- Actor별 token과 session key 분리
- API 요청 시 Bearer token 자동 첨부
- `401`, `419` 응답 시 인증 상태 정리와 로그인 흐름 연결
- 메뉴 노출과 route guard가 같은 permission source 사용
- 프론트 권한은 화면 UX만 제어하고 최종 접근 검증은 서버에서 수행

### 2. 목록과 화면 이동 상태

- 검색, 필터, 정렬과 페이지를 URL query로 관리
- 새로고침·링크 공유 후에도 같은 목록 조건 복원
- 상세 진입 시 `returnTo`를 유지해 이전 검색 조건으로 복귀
- 등록·수정 후 `highlight` query로 변경된 행 강조
- 값이 없는 query는 제거해 URL 상태를 단순하게 유지

### 3. API 요청 안정성

- 공통 API client에서 응답·오류 형식 처리
- `AbortController`로 화면 이동이나 검색 조건 변경 전의 오래된 요청 취소
- 이전 응답이 최신 화면 상태를 덮는 문제 방지
- 공통 타입과 도메인 mapper로 API 응답과 화면 모델의 경계 유지

### 4. 반복 운영 UI 표준화

- 목록·상세·등록·수정 흐름과 상태 badge 규칙 통일
- Table, filter, modal, form, uploader, spinner, global alert 재사용
- TipTap 기반 공지사항 본문과 에디터 이미지 처리
- 단일·다중 미디어의 기존 파일 유지, 교체, 삭제와 정렬 payload 분리
- 운영 판단에 필요한 상태, 이력과 연관 정보를 상세 화면에 함께 배치

### 5. 실시간 통신

- Laravel Echo와 Pusher JS로 Reverb private channel 구독
- 인증 API를 통한 채널 참여 권한 확인
- 메시지 생성·읽음·알림 이벤트 수신 상태 확인
- 모바일 네트워크 재시도와 중복 요청 처리는 백엔드 멱등성 규칙과 함께 검증

## 기술 스택

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

- Next.js 16 App Router, React 19, TypeScript 5
- Tailwind CSS 4, lucide-react
- pnpm 10 workspace, Turborepo 2
- TipTap, ApexCharts, React Day Picker
- Laravel Echo, Pusher JS
- ESLint 9, Prettier 3

## 프로젝트 구조

```text
beaulab_frontend/
├── apps/
│   ├── staff-web/
│   │   ├── app/                 # 인증·관리자 route와 page client
│   │   ├── components/          # 공통·도메인별 UI
│   │   ├── hooks/               # 공통·도메인별 hook
│   │   └── lib/                 # API, mapper, validation, route helper
│   └── user-web/                # 사용자 서비스 웹, 현재 채팅·알림 구현
├── packages/
│   ├── api-client/
│   ├── auth/
│   ├── types/
│   └── ui-admin/
├── doc/                         # 구조와 구현 규칙
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## 실행 방법

Node.js와 pnpm 10이 필요합니다.

```bash
pnpm install
```

개발 서버:

```bash
pnpm --filter staff-web dev  # http://localhost:3000
pnpm --filter user-web dev   # http://localhost:3001
```

전체 검증:

```bash
pnpm format:check
pnpm typecheck
pnpm lint
pnpm build
```

주요 환경변수:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=
NEXT_PUBLIC_REVERB_APP_KEY=
NEXT_PUBLIC_REVERB_HOST=127.0.0.1
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```

## 문서

- [프론트엔드 문서 목록](doc/README.md)
- [아키텍처](doc/architecture.md)
- [Staff Web 구현 규칙](doc/staff-web-rules.md)
- [API 연동](doc/api.md)
- [라우팅](doc/routing.md)
- [목록 화면](doc/list-pages.md)
- [폼](doc/forms.md)
- [미디어](doc/media.md)
- [UI 컴포넌트](doc/ui-components.md)
- [성능](doc/performance.md)

## 관련 저장소

- 프론트엔드: [xowlsakffl/beaulab_frontend](https://github.com/xowlsakffl/beaulab_frontend)
- 백엔드: [xowlsakffl/beaulab_backend](https://github.com/xowlsakffl/beaulab_backend)
