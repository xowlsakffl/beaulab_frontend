# Beaulab Frontend Agent Rules

이 파일은 에이전트 진입점이다. 상세 규칙은 아래 문서를 기준으로 따른다.

- [프론트 문서 인덱스](/root/beaulab_frontend/doc/README.md)
- [아키텍처 문서](/root/beaulab_frontend/doc/architecture.md)
- [Staff Web 규칙 문서](/root/beaulab_frontend/doc/staff-web-rules.md)
- [API 규칙](/root/beaulab_frontend/doc/api.md)
- [라우팅/권한 규칙](/root/beaulab_frontend/doc/routing.md)
- [목록 페이지 규칙](/root/beaulab_frontend/doc/list-pages.md)
- [폼 규칙](/root/beaulab_frontend/doc/forms.md)
- [미디어 규칙](/root/beaulab_frontend/doc/media.md)
- [UI 컴포넌트 규칙](/root/beaulab_frontend/doc/ui-components.md)
- [상태/뱃지 규칙](/root/beaulab_frontend/doc/status-badges.md)
- [도메인 화면 정리](/root/beaulab_frontend/doc/domain-pages.md)
- [성능 규칙](/root/beaulab_frontend/doc/performance.md)
- [개발/검증 규칙](/root/beaulab_frontend/doc/development.md)

## 최소 강제 규칙

- 구조와 구현 규칙의 진실 소스는 `doc/README.md`에 연결된 문서다.
- `common`은 `apps/staff-web` 관리자 앱 전체 공통을 뜻한다.
- 도메인 field name, endpoint, DOM target에 묶인 코드는 `common`으로 올리지 않는다.
- 병의원/의료진 폼은 섹션 단위까지만 컴포넌트를 분리한다.
- 신규 관리자 route는 fail-closed 기준으로 `route-permissions.ts` 권한 매핑을 먼저 확인한다.
- 포맷은 Prettier 기준이다. 변경 후 `pnpm format:check`를 확인한다.
- 구조나 규칙이 바뀌면 관련 문서를 먼저 갱신한다.
