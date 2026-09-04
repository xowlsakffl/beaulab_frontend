# Frontend Documents

작성 기준: 2026-07-27

이 폴더는 `beaulab_frontend`의 프론트엔드 구조, 구현 규칙, 운영 기준을 관리한다. 문서는 현재 코드와 맞아야 하며, 미래 계획이나 아직 없는 코드는 확정된 정책이 아니면 적지 않는다.

## 문서 목록

웹 세션/CSRF/로그아웃 정책: [authentication.md](authentication.md).

| 문서                                                                | 목적                                              |
| ------------------------------------------------------------------- | ------------------------------------------------- |
| [architecture.md](/root/beaulab_frontend/doc/architecture.md)       | 모노레포, 앱, 패키지, 도메인 경계                 |
| [staff-web-rules.md](/root/beaulab_frontend/doc/staff-web-rules.md) | `apps/staff-web` 작업 전 공통 규칙                |
| [development.md](/root/beaulab_frontend/doc/development.md)         | 실행, 포맷, lint, typecheck, build                |
| [api.md](/root/beaulab_frontend/doc/api.md)                         | API client, 인증 만료, 응답 처리, mutation 후처리 |
| [routing.md](/root/beaulab_frontend/doc/routing.md)                 | route group, URL prefix, 메뉴, 권한 매핑          |
| [list-pages.md](/root/beaulab_frontend/doc/list-pages.md)           | 목록 화면 상태, 필터, summary, fetch lifecycle    |
| [forms.md](/root/beaulab_frontend/doc/forms.md)                     | 등록/수정 폼, validation, payload, submit 흐름    |
| [media.md](/root/beaulab_frontend/doc/media.md)                     | 이미지/파일 표시, 검증, object URL, 기본 이미지   |
| [ui-components.md](/root/beaulab_frontend/doc/ui-components.md)     | 공통 UI 컴포넌트 사용 기준                        |
| [status-badges.md](/root/beaulab_frontend/doc/status-badges.md)     | 상태값 문구와 뱃지 색상                           |
| [domain-pages.md](/root/beaulab_frontend/doc/domain-pages.md)       | 도메인별 화면/컴포넌트/API 책임                   |
| [performance.md](/root/beaulab_frontend/doc/performance.md)         | 프론트 성능 기준과 금지 패턴                      |
| [todo.md](/root/beaulab_frontend/doc/todo.md)                       | 보류/후속 작업                                    |

## 갱신 원칙

- 구조가 바뀌면 `architecture.md`와 관련 세부 문서를 같이 고친다.
- 메뉴/route/권한이 바뀌면 `routing.md`를 먼저 확인한다.
- 목록, 폼, 미디어, 상태 UI를 고치면 해당 주제 문서를 갱신한다.
- 문서에 없는 규칙을 새로 만들면 코드 적용 전에 문서에 먼저 남긴다.
- 문서와 코드가 충돌하면 현재 코드를 기준으로 문서를 정리하고, 코드가 잘못된 경우 별도 작업으로 수정한다.
