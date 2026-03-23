# Beaulab Frontend Agent Rules

이 파일은 에이전트 진입점이다. 상세 규칙은 아래 문서를 기준으로 따른다.

- [아키텍처 문서](/root/beaulab_frontend/doc/architecture.md)
- [Staff Web 규칙 문서](/root/beaulab_frontend/doc/staff-web-rules.md)

## 최소 강제 규칙

- 구조와 구현 규칙의 진실 소스는 위 두 문서다.
- `common`은 `apps/staff-web` 관리자 앱 전체 공통을 뜻한다.
- 도메인 field name, endpoint, DOM target에 묶인 코드는 `common`으로 올리지 않는다.
- 병의원/의료진 폼은 섹션 단위까지만 컴포넌트를 분리한다.
- 구조나 규칙이 바뀌면 위 두 문서를 먼저 갱신한다.
