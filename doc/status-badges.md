# Frontend Status And Badge Rules

작성 기준: 2026-08-27

이 문서는 상태값 문구와 뱃지 색상 기준이다.

## 0. 공통 렌더링 규칙

- 상태값 렌더링은 `ui-admin`의 `StatusValueBadge` 하나를 사용한다.
- 공통 색상은 `apps/staff-web/lib/common/status-badge-colors.ts`의 `STATUS_BADGE_COLORS`를 기준으로 한다.
- 검수상태, 운영중지, 공개여부는 별도 React 컴포넌트를 만들지 않고 기존 라벨 함수와 색상 함수를 조합한다.
- 신고상태와 경고여부도 `StatusValueBadge`에 `reportStatusBadgeColor`, `reportWarningBadgeColor` 결과를 전달한다.
- 상태 뱃지 기본 크기는 `sm`, 기본 형태는 `light`, 값이 없을 때는 회색 `-`로 통일한다.
- 화면에서 `StatusBadge`를 직접 조립하거나 상태 코드별 색상을 다시 분기하지 않는다.
- 카테고리, 파일 형식, 광고 달력 구좌, 카운트는 상태가 아니므로 상태 뱃지 컴포넌트에 합치지 않는다.

## 1. 검수 상태

대상:

- 병의원
- 의료진
- 이벤트
- 입점신청
- 광고

컬럼명:

- 백엔드: `allow_status`
- 프론트 표시: 검수상태

문구와 색상:

| Code        | Label | Color                 |
| ----------- | ----- | --------------------- |
| `PENDING`   | 신청  | 파랑                  |
| `REVIEWING` | 검수  | 주황 (`#D65600` 계열) |
| `APPROVED`  | 승인  | 초록                  |
| `REJECTED`  | 반려  | 빨강                  |

규칙:

- 라벨/색상은 `apps/staff-web/lib/common/review-status.ts`의 `labelReviewAllowStatus`, `reviewAllowStatusColor`를 사용한다.
- `검토중` 같은 다른 워딩을 쓰지 않는다.
- 검수 버튼에는 `신청` 액션을 노출하지 않는다.
- 현재 상태 버튼은 disabled 또는 current 스타일로 표시한다.
- 반려는 반려사유 입력 모달을 붙인다.

## 2. 병의원/동영상/이벤트 강제중지

직원 관리자가 강제로 제한하는 상태는 `admin_status`를 사용한다.

문구:

| Code                                | Label    | Color |
| ----------------------------------- | -------- | ----- |
| `NORMAL`, `ACTIVE` 또는 정상 계열   | 정상     | 초록  |
| `FORCED_STOPPED` 또는 강제중지 계열 | 강제중지 | 빨강  |

버튼:

- 라벨/색상은 `apps/staff-web/lib/common/status-labels.ts`의 `labelAdminStatus`, `adminStatusColor`를 사용한다.
- 현재 정상 상태면 `강제중지`
- 현재 강제중지 상태면 `정상노출`
- 상세에서는 취소 버튼 없이 확인 모달 기준을 따른다.
- 사유 입력 스타일은 다른 상태 변경 모달과 맞춘다.

병의원 계정의 `status = SUSPENDED`는 강제중지가 아닌 운영상태 `운영중지`이며, 검수와 같은 주황(`#D65600` 계열)을 사용한다.

## 3. 공개 여부

병원 관리자 또는 콘텐츠 소유자가 설정하는 공개/비공개 상태는 `hospital_status`를 사용한다.

문구:

| Code        | Label  |
| ----------- | ------ |
| 공개 계열   | 공개   |
| 비공개 계열 | 비공개 |

`admin_status`와 섞지 않는다.

라벨/색상은 `apps/staff-web/lib/common/status-labels.ts`의 `labelOwnerVisibilityStatus`, `ownerVisibilityStatusColor`를 사용한다. 단, 도메인 문구가 다르면 라벨 함수 옵션으로 조정한다. 예: 이벤트는 `비공개`, 동영상은 `미공개`.

## 4. 게시물/댓글 공개 여부

게시물/댓글의 일반 노출 상태는 기존 도메인에 따라 `노출`/`미노출`을 사용한다.
목록 필터, 테이블 컬럼, 상태 변경 모달의 필드명은 `공개여부`로 통일한다.
기존 운영 이력의 `노출여부` 또는 `노출 여부` 라벨은 화면 표시 단계에서 `공개여부`로 정규화한다.

신고게시물에서 조치 결과가 필요한 경우:

- 성형후기/쁘띠후기/토크/평가 게시물: 도메인 정책에 맞춰 노출/미노출 또는 정상노출/노출중지 사용
- 댓글 신고 처리: 상세 페이지 없이 신고목록 모달과 처리 모달 사용

문구는 같은 컬럼이라도 도메인 맥락에 따라 달라질 수 있으므로 `field_label` 또는 도메인 표시 helper를 기준으로 한다.

## 5. 신고 상태

신고상태 색상:

| Code                       | Label                  | Color                             |
| -------------------------- | ---------------------- | --------------------------------- |
| `REPORTED` 또는 `RECEIVED` | 신고접수               | 연한 노랑 배경 + 진한 황갈색 글씨 |
| `AUTO_BLOCKED`             | 자동차단               | 빨강                              |
| `ADMIN_HIDDEN`             | 삭제처리 또는 노출중지 | 주황 (`#D65600` 계열)             |
| `NORMAL_VISIBLE`           | 신고오류 또는 정상노출 | 초록                              |
| `REEXPOSED`                | 재노출                 | 파랑                              |

동영상 신고:

- 삭제처리: 영상을 삭제처리/미노출로 보는 상태
- 신고오류: 허위신고로 보는 상태
- 신고접수 뱃지는 상세에서 불필요하면 노출하지 않는다.

신고상태 뱃지는 `reportStatusBadgeColor`, `reportStatusBadgeLabel`을 사용한다. 동영상처럼 도메인별 워딩이 다른 경우에도 같은 의미의 색상 기준은 맞춘다.
문구를 별도로 전달하지 않는 화면은 `reportStatusBadgeLabel`을 사용하며, `REPORTED` 상태를 `정상노출`처럼 다른 상태 문구로 표시하면 안 된다.

이벤트 DB의 `중복`, `미인증DB 신고`는 공통 주황(`#D65600` 계열) `attention` 색상을 사용한다.

## 6. 승인 상태

리얼모델 DB 등 승인형 도메인은 `승인상태`로 표기한다.

문구:

- 신청
- 승인
- 불가

검수상태와 같은 `allow_status`인지, 별도 approval/status인지 도메인 API 계약을 확인하고 표시한다.

## 7. 히스토리 문구

상태 변경 히스토리 action은 단순해야 한다.

기준:

- 일반 필드 수정: `수정`
- 상태 계열 변경: `상태 변경`
- 상세 field label: `검수상태 변경`, `영수증 상태 변경`, `조치유형 변경`, `경고여부 변경`처럼 백엔드가 내려주는 label 우선

프론트에서 `field_key`를 보고 임의로 새 문구를 조합하지 않는다. 백엔드 `field_label`, `before_display`, `after_display`를 우선 사용한다.
