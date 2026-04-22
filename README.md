# 뷰랩 - 성형·뷰티 중개 플랫폼 프론트엔드

뷰랩은 성형·시술 병원 중개와 뷰티·라이프스타일 업체 추천을 분리해 운영하는 뷰랩 플랫폼의 프론트엔드 모노레포입니다. 병원 영역은 성형외과/피부과의 시술·수술 정보, 의료진, 가격, 이벤트, 상담, 예약, 후기 흐름을 다루고, 뷰티 영역은 미용실, 필라테스, 피부샵, 네일샵 등 비의료 뷰티 업체의 추천, 정보 탐색, 예약, 후기 흐름을 다룹니다.

현재 실제 운영 중심 앱은 `apps/staff-web` 관리자 웹입니다. `apps/user-web`은 앱 사용자 간 1:1 채팅과 Reverb 실시간 이벤트를 브라우저에서 수동 검증하기 위한 테스트 앱입니다. 공통 HTTP, 인증, 타입, 관리자 UI는 `packages/*` 워크스페이스 패키지로 분리합니다.

이 저장소는 뷰랩 플랫폼의 관리자 화면, 공통 UI 시스템, Actor별 세션/권한 처리, API client, 채팅 테스트 화면을 담당합니다. 백엔드 API와 연결해 병원/뷰티 파트너 관리, 콘텐츠 관리, 신고/게시물 운영, 공지사항, FAQ, 유저 관리, 동영상 관리, 유저 간 채팅 검증 흐름을 제공합니다.

## 서비스 범위

이 README의 서비스 범위는 현재 구현된 화면과 성형·뷰티 추천 플랫폼으로 확장할 예정인 프론트엔드 영역을 함께 포함합니다.

- Staff 관리자 웹
  - Staff 로그인, 세션 복구, 로그아웃, 프로필 관리
  - 병의원/뷰티 도메인 토글 기반 관리자 shell
  - 병의원 대시보드, 뷰티 대시보드
  - 성형/시술 병원 관리
  - 병원 의료진 관리
  - 병원 동영상 관리
  - 병원 토크/게시물/신고 콘텐츠 관리
  - 병원 광고, 이벤트, 상품, 상품 캘린더 관리
  - 병원 고객 DB, 비대면상담 DB, 리얼모델 DB 관리
  - 뷰티샵 관리
  - 뷰티 전문가 관리
  - 뷰티 후기, 리뷰, 토크, 신고 콘텐츠 관리
  - 뷰티 광고, 이벤트, 상품, 상품 캘린더 관리
  - 뷰티 고객 DB, 비대면상담 DB, 리얼모델 DB 관리
  - 공지사항, FAQ, 1:1 문의 관리
  - 일반 회원, 대행사, 카테고리, 해시태그 관리
  - 배너, 팝업, 상단 타이틀 등 공통 콘텐츠 관리
  - 충전금, 통계, 유해성 단어, 닉네임, 직원 설정 관리
- User Web 테스트 앱
  - 일반 사용자 로그인 테스트
  - 유저 간 1:1 채팅방 목록 조회
  - 첫 메시지 기반 채팅방 생성
  - 텍스트/이미지/파일 메시지 전송 테스트
  - 메시지 목록 조회와 읽음 처리
  - 채팅방별 알림 on/off 확인
  - 사용자 알림함, 미읽음 수, 단건/전체 읽음 처리 확인
  - Laravel Reverb private channel 기반 실시간 메시지/읽음/알림 이벤트 확인
- 공통 프론트엔드 인프라
  - pnpm workspace + Turborepo 기반 모노레포
  - Next.js App Router 기반 앱 구성
  - Actor별 token/session storage
  - Staff API client와 공통 ApiResponse 타입
  - 메뉴 권한과 라우트 권한 매핑
  - 관리자 공통 UI 컴포넌트
  - form, table, modal, editor, uploader, spinner, global alert 패턴

## 앱 구조

| App | 경로 | 상태 | 역할 |
| --- | --- | --- | --- |
| Staff Web | `apps/staff-web` | 운영 중심 | 내부 운영자 관리자 웹 |
| User Web | `apps/user-web` | 테스트 앱 | 앱 사용자 채팅/알림 API 수동 검증 |

`apps/staff-web`는 관리자 제품 로직을 소유합니다. 메뉴, 권한, 라우트, 병원/뷰티 도메인 토글, 목록/상세/등록/수정 흐름은 이 앱 안에 둡니다.

`apps/user-web`는 실제 사용자 프로덕션 웹이 아니라 채팅 API와 Reverb 이벤트를 브라우저에서 확인하기 위한 임시 검증 앱입니다. Staff 관리자 shell이나 `ui-admin` 스타일을 공유하지 않습니다.

## 도메인 기반 프론트 설계

프론트엔드는 백엔드 DDD 구조와 맞춰 Actor 경계와 도메인 경계를 분리합니다. Actor는 어떤 사용자가 접근하는지에 대한 경계이고, 도메인은 화면과 비즈니스 기능의 책임 경계입니다.

### 계층 구조

| 계층 | 위치 | 책임 |
| --- | --- | --- |
| App Route | `apps/*/app` | Next.js App Router 페이지, layout, route group |
| Page Client | `apps/staff-web/app/**/**/*Client.tsx` | 페이지 단위 상태, fetch, submit, redirect, error state |
| Domain Components | `apps/staff-web/components/{domain}` | 도메인 전용 section, table, filter, modal |
| Domain Hooks | `apps/staff-web/hooks/{domain}` | endpoint, field name, DOM target에 묶인 도메인 훅 |
| Domain Lib | `apps/staff-web/lib/{domain}` | form/list 상수, validation, mapper, query helper |
| Staff Common | `apps/staff-web/components/common`, `apps/staff-web/lib/common` | staff 관리자 앱 전용 guard, sidebar, auth session, routing, navigation |
| Workspace Packages | `packages/*` | 앱 비의존 공통 UI, auth, API client, type |

### 도메인 경계

| 영역 | 포함 기능 | 설명 |
| --- | --- | --- |
| Hospital Admin | `hospitals`, `doctors`, `videos`, `hospital talks` | 성형/시술 병원, 의료진, 영상, 병원 토크 운영 |
| Beauty Admin | `beauties`, `experts`, `beauty-*` pages | 미용실/필라테스/피부샵/네일샵 등 뷰티 업체와 전문가 운영 |
| Common Admin | `notices`, `faqs`, `users`, `categories`, `hashtags`, `content`, `settings` | 병원/뷰티 공통 운영 화면 |
| Communication Test | `apps/user-web` | 유저 간 채팅, 읽음, 알림, Reverb 이벤트 검증 |
| Shared UI | `packages/ui-admin` | 제품 비의존 관리자 UI 컴포넌트와 layout |
| Shared Runtime | `packages/api-client`, `packages/auth`, `packages/types` | API 요청, token/session storage, 공통 타입 |

### 요청 처리 흐름

```text
Page
  -> *Client.tsx
  -> domain lib mapper / validator
  -> @beaulab/api-client or app local api client
  -> Laravel API
  -> ApiResponse
  -> domain row/form mapper
  -> UI state
```

목록 화면은 URL query를 상태의 단일 기준으로 사용합니다. 상세 진입 시 `returnTo`를 유지하고, 등록/수정 후 목록으로 돌아오면 `highlight` query로 변경된 행을 강조합니다.

### 설계 원칙

- `packages/*`는 특정 actor, route, 도메인 업무 규칙을 알면 안 됩니다.
- `apps/staff-web`의 `common`은 staff 관리자 앱 전체 공통을 뜻합니다.
- 병원/의료진/공지/동영상처럼 field name과 endpoint에 묶인 코드는 도메인 폴더에 둡니다.
- 폼 컴포넌트는 섹션 단위까지만 분리합니다.
- 목록은 toolbar, filter, table 정도까지만 분리합니다.
- 브라우저 `alert()` 대신 하단 전역 alert를 사용합니다.
- 로딩은 spinner 패턴을 사용합니다.
- 메뉴 노출과 라우트 보호는 같은 permission source를 공유합니다.
- 프론트 권한은 UX 제어 목적이며, 최종 권한 검증은 서버가 담당합니다.

## 주요 기능

### Staff Web

- Staff 인증
  - `POST /api/v1/staff/auth/login`
  - token 저장
  - `GET /api/v1/staff/profile`
  - roles/permissions 기반 세션 복구
  - 보호 라우트 진입
- 관리자 shell
  - 병의원/뷰티 도메인 토글
  - 도메인 메뉴와 공통 메뉴 분리
  - permission 기반 메뉴 필터링
  - route permission 기반 guard
- 병의원 관리
  - 목록, 검색, 필터, 정렬, 페이지네이션
  - 상세 조회
  - 생성/수정
  - 사업자 정보, 주소 검색, 병의원 특징, 미디어 업로드
- 의료진 관리
  - 목록, 상세, 생성, 수정
  - 병의원 옵션 조회
  - 시술 분야 카테고리 선택
  - 의료진 프로필/증빙 정보 입력
- 동영상 관리
  - 목록, 상세, 생성, 수정
  - 병원/의사 옵션 조회
  - 게시기간, 카테고리, 썸네일, 영상 파일 처리
  - 영상 파일 다운로드
- 공지사항 관리
  - 목록, 상세, 생성, 수정
  - RichTextEditor 기반 본문 작성
  - 에디터 이미지 업로드/정리
  - 첨부파일 업로드
  - 채널, 상태, 게시기간, 상단 고정, 중요 팝업 설정
- 해시태그 관리
  - 목록, 필터, 생성/수정 모달
- 토크 관리
  - 목록, 필터, 테이블 조회
- 뷰티 영역 placeholder/관리 화면
  - 뷰티 대시보드
  - 뷰티샵, 뷰티전문가
  - 뷰티 충전금
  - 뷰티 고객 DB
  - 뷰티 광고/상품
  - 뷰티 후기/리뷰/토크
  - 뷰티 신고 콘텐츠
- 공통 운영 화면
  - FAQ, 1:1 문의
  - 일반 회원, 대행사
  - 카테고리, 해시태그
  - 배너, 팝업, 상단 타이틀
  - 통계
  - 유해성 단어, 닉네임, 직원 설정

### User Web

- 두 사용자 슬롯 기반 로그인 테스트
- 앱 사용자 채팅방 목록 조회
- 첫 메시지 전송으로 채팅방 생성
- 기존 채팅방 메시지 전송
- 첨부파일 전송
- 읽음 처리
- 채팅방 알림 상태 확인
- 알림 목록과 미읽음 수 확인
- `private-chat.{chatId}` 채널 구독
- `.chat.message.created` 이벤트 수신
- `.chat.read.updated` 이벤트 수신
- `private-user.{userId}` 채널 구독
- `.notification.inbox.updated` 이벤트 수신

## 주요 패키지

| Package | 경로 | 책임 |
| --- | --- | --- |
| `@beaulab/api-client` | `packages/api-client` | Actor별 token을 붙이는 fetch wrapper, query builder, ApiResponse 처리 |
| `@beaulab/auth` | `packages/auth` | Actor별 token/session localStorage, permission helper |
| `@beaulab/types` | `packages/types` | Actor, session, profile, ApiResponse 공통 타입 |
| `@beaulab/ui-admin` | `packages/ui-admin` | 관리자 layout, form, table, modal, editor, uploader, alert, spinner UI |

## 권한과 세션

- token은 `beaulab.token.{actor}` key로 localStorage에 저장합니다.
- session은 `beaulab.session.{actor}` key로 localStorage에 저장합니다.
- Staff Web은 `staff` actor token만 사용합니다.
- 메뉴와 라우트 guard는 `roles`, `permissions`를 UX 제어에 사용합니다.
- 라우트 권한 단일 소스는 `apps/staff-web/lib/common/routing/route-permissions.ts`입니다.
- 사이드바 메뉴는 정적 path별 permission helper를 참조합니다.
- 서버 권한 검증은 프론트 권한 처리로 대체하지 않습니다.

## UI 정책

- 관리자 shell과 사이드바 조합은 `apps/staff-web`가 소유합니다.
- `packages/ui-admin`은 앱 전용 도메인 개념 없이 렌더링 가능한 UI만 제공합니다.
- 브라우저 `alert()`는 사용하지 않고 전역 하단 alert를 사용합니다.
- 페이지/섹션 로딩은 spinner를 우선 사용합니다.
- status, allow_status, approval 류 선택은 기존 `Select` 패턴을 우선 재사용합니다.
- 설명이 붙는 boolean 설정은 `FormSettingToggleRow`를 우선 재사용합니다.
- HTML 본문 편집은 `RichTextEditor`를 우선 재사용합니다.
- 업로드는 `MediaUploader`를 우선 재사용합니다.
- 반복되는 modal panel/header/footer 구조는 `ui-admin`의 modal 조합 컴포넌트를 우선 재사용합니다.

## 미디어 처리

- 수정 폼의 미디어 payload는 최종 상태 기준으로 전송합니다.
- 단일 파일은 `existing_*_id`와 선택적인 새 파일을 함께 사용합니다.
- 다중 파일은 `existing_*_ids[]`와 새 파일 배열을 함께 사용합니다.
- 기존/신규 다중 파일을 섞어 정렬해야 하면 `gallery_order[]` 같은 명시적 순서 payload를 사용합니다.
- 병의원 갤러리는 `existing:{id}` / `new:{index}` 토큰 기반 `gallery_order[]`를 사용합니다.
- 동영상 원본 파일은 staff가 교체하지 않고 삭제만 할 수 있으므로 `remove_video_file`을 사용합니다.

## 기술 스택

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)
![Laravel Echo](https://img.shields.io/badge/Laravel%20Echo-Reverb-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- pnpm workspace
- Turborepo
- ESLint 9
- Laravel Echo
- Pusher JS
- TipTap RichTextEditor
- React Day Picker
- lucide-react

## 프로젝트 구조

```text
beaulab_frontend/
├── apps/
│   ├── staff-web/
│   │   ├── app/
│   │   │   ├── (admin)/              # 관리자 보호 영역
│   │   │   └── (auth)/               # 로그인/회원가입 영역
│   │   ├── components/
│   │   │   ├── common/               # staff-web 전용 공통 adapter
│   │   │   ├── hospital/             # 병의원 폼/목록 컴포넌트
│   │   │   ├── doctor/               # 의료진 폼/목록 컴포넌트
│   │   │   ├── video/                # 동영상 폼/목록 컴포넌트
│   │   │   ├── notice/               # 공지사항 폼/목록 컴포넌트
│   │   │   ├── hashtag/              # 해시태그 목록/모달
│   │   │   └── talk/                 # 토크 목록
│   │   ├── hooks/
│   │   │   ├── common/               # 도메인 비의존 훅
│   │   │   ├── hospital/
│   │   │   ├── doctor/
│   │   │   ├── video/
│   │   │   └── notice/
│   │   └── lib/
│   │       ├── common/               # API, auth, routing, navigation
│   │       ├── hospital/
│   │       ├── doctor/
│   │       ├── video/
│   │       ├── notice/
│   │       ├── hashtag/
│   │       └── talk/
│   └── user-web/
│       └── app/                      # 채팅/Reverb 수동 검증 화면
├── packages/
│   ├── api-client/                   # fetch wrapper, query builder
│   ├── auth/                         # token/session storage, permission helper
│   ├── types/                        # 공통 타입
│   └── ui-admin/                     # 관리자 UI, layout, form, table, modal
├── doc/
│   ├── architecture.md
│   └── staff-web-rules.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## 실행 준비

의존성 설치:

```bash
pnpm install
```

Staff Web 개발 서버:

```bash
pnpm --filter staff-web dev
```

User Web 채팅 테스트 서버:

```bash
pnpm --filter user-web dev
```

전체 검증:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

개별 앱 검증:

```bash
pnpm --filter staff-web typecheck
pnpm --filter staff-web lint
pnpm --filter staff-web build
```

## 주요 환경변수

| 변수 | 앱 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `staff-web`, `user-web` | Laravel API base URL. 예: `http://localhost:8000` |
| `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` | `staff-web` | Daum/Kakao 주소 검색 연동용 JavaScript key |
| `NEXT_PUBLIC_REVERB_APP_KEY` | `user-web` | Laravel Reverb app key |
| `NEXT_PUBLIC_REVERB_HOST` | `user-web` | Reverb host |
| `NEXT_PUBLIC_REVERB_PORT` | `user-web` | Reverb port |
| `NEXT_PUBLIC_REVERB_SCHEME` | `user-web` | Reverb scheme (`http`, `https`) |

예시:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=
NEXT_PUBLIC_REVERB_APP_KEY=beaulab-local-key
NEXT_PUBLIC_REVERB_HOST=127.0.0.1
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```

## 확장 예정 범위

아래 항목은 뷰랩 서비스 범위에는 포함하지만, 현재 프론트 코드와 문서 기준으로 추가 설계와 구현이 필요한 영역입니다.

- User 앱/웹
  - 병원 검색, 시술/수술 상세, 이벤트, 후기, 예약, 견적
  - 미용실, 필라테스, 피부샵, 네일샵 추천/탐색/예약
  - 유저 간 채팅의 실제 앱 UI
  - 알림함, 마이페이지, 즐겨찾기, 최근 본 항목
- Hospital 파트너 웹
  - 병원 정보, 의료진, 상품/이벤트, 상담, 예약, 후기 관리
- Beauty 파트너 웹
  - 뷰티 업체 정보, 전문가, 서비스 상품, 예약, 후기 관리
- Staff Web 확장
  - 신고/제재 처리 화면
  - 성형/뷰티 후기 검수
  - 상담/예약/견적 운영 화면
  - 검색/추천/랭킹/기획전 운영 화면
  - 광고 상품/상위 노출 정책 관리

## 참고 문서

- [아키텍처 문서](/root/beaulab_frontend/doc/architecture.md)
- [Staff Web 규칙 문서](/root/beaulab_frontend/doc/staff-web-rules.md)
- [레포 AGENTS 규칙](/root/beaulab_frontend/AGENTS.md)

`README.md`는 사람 기준 진입 문서이고, `AGENTS.md`는 에이전트가 자동으로 읽는 규칙 진입 파일입니다. 구조나 구현 규칙이 바뀌면 `doc/architecture.md`, `doc/staff-web-rules.md`를 먼저 갱신합니다.

## 관련 저장소

- 프론트엔드 원격 저장소: `https://github.com/beaulab/beaulab_new_frontend.git`
- 프론트엔드 push 대상: `https://github.com/xowlsakffl/beaulab_frontend.git`
- 백엔드 저장소: `https://github.com/xowlsakffl/beaulab_backend.git`
