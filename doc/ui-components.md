# Frontend UI Component Rules

작성 기준: 2026-07-27

이 문서는 공통 UI 컴포넌트 사용 기준이다.

## 1. 레이어 구분

| 위치                                 | 의미                         |
| ------------------------------------ | ---------------------------- |
| `packages/ui-admin`                  | 제품 비의존 관리자 UI        |
| `apps/staff-web/components/common`   | staff 관리자 앱 전용 공통 UI |
| `apps/staff-web/components/{domain}` | 도메인 전용 UI               |

`packages/ui-admin`은 staff route, permission, hospital/event 같은 업무 개념을 알면 안 된다.

## 2. `packages/ui-admin`

현재 주요 책임:

- layout: `AppHeader`, `AppSidebar`
- auth form: `SignInForm`, `PasswordResetRequestForm`, `PasswordResetForm`
- form: `InputField`, `Select`, `MultiSelect`, `TogglePillGroup`, `FormSettingToggleRow`, `RichTextEditor`

### 폼 컨트롤 높이

- 한 줄 입력 컨트롤의 기본 높이는 `h-11`이다.
- `InputField`, `Select`, 날짜 선택, 목록 필터, 파일 입력, 전화번호 입력은 공통 컴포넌트의 기본 높이를 사용한다.
- 페이지에서 높이를 반복 지정하지 않는다. 공통 입력 컴포넌트는 페이지의 높이 덮어쓰기와 관계없이 `h-11`을 유지한다. 다중 행 입력, 미디어 영역, 소형 아이콘·행 액션 버튼만 별도 높이를 사용할 수 있다.
- 인라인 파일 입력은 `InlineFileSelect`의 액션 버튼, 파일명, `helperText` 규격 안내 영역을 사용한다. 파일명과 규격을 한 줄에 강제로 넣거나 페이지에서 안내 문구를 중복 렌더링하지 않는다.
- table: `DataTable`, `Pagination`
- modal/button/card/badge 계열 공통 UI
- error: `ErrorStatusPage`
- alert context

추가 기준:

- 앱/도메인 문구 없는 UI만 추가한다.
- API 호출을 넣지 않는다.
- `useRouter` 같은 imperative route 이동을 넣지 않는다.
- `AppSidebar`처럼 상위 앱에서 받은 path를 `Link`로 렌더링하는 정도는 허용한다.
- 도메인 status code를 직접 알지 않는다.
- export하지 않는 예제/템플릿 파일을 숨겨두지 않는다.
- `packages/ui-admin` 타입체크는 `src` 전체를 대상으로 실행되어야 한다.

## 3. `components/common`

staff 앱 전용 공통 UI다.

현재 주요 컴포넌트:

- `LoadErrorState`
- `SummaryCountCard`
- `AllowStatusControls`
- `VisibilityActionButtons`
- `ReportStatusBadge`
- `OperationHistoryCard`
- `OperationHistoryDisplay`
- `MediaPreviewModal`
- `DetailImageGallery`
- `DetailMediaCard`
- `AddCircleButton`
- `guard`
- `sidebar-menu`

추가 기준:

- 두 개 이상 도메인에서 같은 의미로 쓰일 때만 올린다.
- field key, endpoint, 도메인 전용 payload를 알면 common이 아니다.

## 4. Modal

모달은 `@beaulab/ui-admin`의 Modal 계열을 사용한다.

기준:

- 제목은 `ModalTitle`로 표시한다.
- confirm/cancel 버튼 위치와 크기는 기존 상태 변경 모달을 따른다.
- 반려/중지/부적합 사유 입력은 `InputField` 스타일을 사용한다.
- textarea가 꼭 필요한 장문 사유가 아니면 기존 input 스타일과 맞춘다.
- 닫기 X 버튼 크기와 위치를 모달마다 임의 변경하지 않는다.

## 5. LoadError

전체 화면 로드 실패는 `LoadErrorState`를 사용한다.

기준:

- 중앙 배치
- 제목과 메시지만 표시
- 흰 박스 없음
- 취소 버튼 없음
- 다시 불러오기 버튼 없음

## 6. Summary

summary 숫자 카드는 `SummaryCountCard`를 사용한다.

기준:

- 기본은 입점신청/병의원/이벤트 summary 스타일이다.
- 회원상세처럼 중앙형 카드가 필요한 경우 `layout="center"`를 사용한다.
- 클릭 가능한 경우 `pressed`로 선택 상태를 표현한다.

## 7. History / Admin memo

운영 히스토리는 `OperationHistoryCard`와 `OperationHistoryDisplay`를 우선 사용한다.

기준:

- 히스토리 행 텍스트 크기는 도메인마다 들쭉날쭉하면 안 된다.
- 타이틀과 empty 문구는 row 본문 크기와 구분한다.
- 페이지네이션 중 기존 목록을 비워 스크롤이 튀게 하지 않는다.

관리자 메모 플러스 버튼:

- 메모 카드 우측 하단 고정 버튼은 공통 absolute 패턴을 사용한다.
- 카드별 하단 여백이 달라지지 않게 한다.

## 8. Calendar / Sticker

광고 달력처럼 제품 공통으로 재사용되는 달력은 `ui-admin` 또는 staff common 레이어로 올린다.

기준:

- 월 이동 시 기존 월 뱃지가 로딩 중 잠깐 다른 칸에 보이면 안 된다.
- 로딩 중에는 표시 데이터를 숨기거나 skeleton 기준을 명확히 한다.
- 스티커/팝오버는 클릭한 뱃지 근처에 위치한다.
- 외부 클릭 시 닫힌다.
- X 버튼 크기는 모달 기준과 맞춘다.
