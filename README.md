# Beaulab Frontend

Beaulab 프로젝트의 Frontend 모노레포입니다.

이 레포는 Web(App Router 기반 Next.js)과 Mobile을 분리된 구조로 관리하며,  
Laravel API 서버와 완전히 분리된 아키텍처를 전제로 합니다.

---

# 📦 프로젝트 구조

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


---

# 🏗 아키텍처 원칙

- Backend(Laravel)와 완전 분리
- Sanctum 토큰 기반 인증
- Permission 기반 UI 분기
- User Web과 Admin UI 완전 분리
- 공용화는 반드시 `packages/*`로 이동

---

# 🚀 기술 스택

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- Radix UI
- pnpm (Workspace)
- WSL 개발 환경 권장

---

# 🛠 개발 환경 세팅

## 1️⃣ WSL 홈 디렉토리에서 개발 (권장)

프로젝트는 `/mnt/c`가 아닌 WSL 홈 디렉토리에서 개발하는 것을 권장합니다.

예: /home/username/beaulab_frontend


---

## 2️⃣ 패키지 설치

```bash
pnpm install

# 🚀 개발 서버 실행

## 1️⃣ 사전 조건

- Node.js 18 이상
- pnpm 설치
- WSL 홈 디렉토리에서 개발 권장
- `.env.local` 파일 생성 완료

---

## 2️⃣ 의존성 설치

프로젝트 루트에서:

```bash
pnpm install

## 3️⃣ 개별 앱 실행

Beaulab Frontend는 모노레포 구조이므로  
실행할 앱을 `--filter` 옵션으로 지정해야 합니다.


