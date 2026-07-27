# Frontend Form Rules

작성 기준: 2026-07-27

이 문서는 등록/수정 폼 구현 규칙이다.

## 1. 기본 흐름

submit 순서는 고정한다.

```text
validate -> payload build -> api call -> success/error handling
```

규칙:

- validation 실패 시 API를 호출하지 않는다.
- payload 생성은 가능한 한 도메인 lib의 pure helper로 둔다.
- 성공 후 이동은 Client가 결정한다.
- 성공 후 목록 복귀는 `returnTo`와 `highlight`를 지킨다.

## 2. 파일 책임

| 위치                                    | 책임                                              | 금지                       |
| --------------------------------------- | ------------------------------------------------- | -------------------------- |
| `page.tsx`                              | params 전달, Client 렌더                          | 상태, API, validation      |
| `*CreateFormClient.tsx`                 | 초기 로드, submit orchestration, 이동             | 긴 validation/payload 구현 |
| `*EditFormClient.tsx`                   | 상세 로드, form 초기화, submit orchestration      | 서버 응답 직접 렌더        |
| `components/{domain}/form/*Section.tsx` | 섹션 UI                                           | API 호출, submit, router   |
| `lib/{domain}/form.ts`                  | 타입, 초기값, validation, mapper, payload builder | React state, API, modal    |
| `hooks/{domain}/use*MediaState.ts`      | 반복 미디어 상태                                  | API submit                 |

## 3. Form state

기본은 하나의 `form` object다.

분리할 state:

- 신규 file
- existing media
- 선택된 카테고리/해시태그 객체
- modal open state
- submit/loading state
- initial value 비교용 state

서버 응답 DTO를 그대로 form state로 들고 다니지 않는다. 도메인 mapper로 form shape를 만든다.

## 4. Validation

validation은 side effect 없는 pure function이어야 한다.

규칙:

- API 호출 금지
- router 사용 금지
- DOM 조작 금지
- alert/modal 사용 금지
- error key는 실제 form field key와 맞춘다.
- field focus 순서는 명시적 배열로 관리한다.

UI 컴포넌트 안에서 필수 문구를 임의 생성하지 않는다. 필수값 문구와 파일 조건은 도메인 validation이 소유한다.

## 5. Field error

기준:

- 에러 메시지는 해당 field 아래에 둔다.
- field와 멀리 떨어진 카드 전체 border로만 표시하지 않는다.
- 파일/이미지 필수값도 field 기준으로 왼쪽 정렬한다.
- 서버 validation error key와 프론트 field key가 다르면 mapper에서 맞춘다.

## 6. 버튼

헤더 저장 버튼:

- 등록/수정 화면의 주요 저장 액션은 헤더 우측 버튼을 기본으로 한다.
- 중복 클릭 방지를 위해 `isSubmitting`과 disabled를 연결한다.

취소/뒤로가기:

- 취소 버튼은 화면 정책상 필요한 곳에만 둔다.
- wizard 형태에서는 이전 단계 이동을 뒤로가기 아이콘/문구로 통일한다.
- 취소 시 highlight를 남기지 않는다.

## 7. Select / search input

검색형 선택 UI는 기존 도메인의 병의원 검색/이벤트 검색 패턴을 우선 따른다.

기준:

- label과 placeholder를 명확히 둔다.
- 선택 후 표시 UI는 도메인마다 새로 만들지 않는다.
- API option 결과는 화면 shape로 normalize한다.
- 이미 선택된 값이 있으면 수정 페이지 진입 시 바로 표시되어야 한다.

## 8. 대형 Client 분리 기준

Client가 아래 책임을 동시에 많이 가지면 분리한다.

- 초기 data load
- option load
- form state
- validation
- media state
- submit
- modal
- history/admin memo

분리 우선순위:

1. 도메인 lib로 pure helper 이동
2. 섹션 컴포넌트 분리
3. 반복 미디어 상태 hook 분리
4. modal 컴포넌트 분리
