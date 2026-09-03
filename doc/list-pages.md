# Frontend List Page Rules

작성 기준: 2026-07-27

이 문서는 목록 페이지 공통 구현 규칙이다.

## 1. 책임 분리

목록 화면은 아래 구조를 기본으로 한다.

| 위치                   | 책임                                                       |
| ---------------------- | ---------------------------------------------------------- |
| `*TableClient.tsx`     | URL state, fetch orchestration, page action, row 선택 상태 |
| `*FilterPanel.tsx`     | draft filter UI와 입력 변경                                |
| `*DataTable.tsx`       | row 렌더링, 정렬 클릭, 행 액션                             |
| `*SummaryCards.tsx`    | summary 표시와 클릭 필터                                   |
| `lib/{domain}/list.ts` | query parse/build, row mapper, formatter, option 상수      |

FilterPanel과 DataTable에서는 API 호출, router 이동, 서버 응답 파싱을 하지 않는다.

## 2. URL state

목록의 단일 기준은 URL query다.

URL에 보존할 값:

- 검색어
- 필터
- 정렬
- 페이지
- `per_page`
- summary card filter
- tab이 있는 경우 현재 tab

검색어 입력값은 draft state로 들고, 검색 버튼 또는 Enter 시 applied query로 반영한다. key stroke마다 API를 호출하지 않는다.

같은 페이지의 query 반영은 `replaceCurrentPageUrl`을 사용한다. Client가 직접 데이터를 조회하므로 필터/정렬/페이지 변경마다 `router.replace`로 Server Component를 다시 요청하지 않는다. 목록에서 상세로 이동하는 실제 경로 변경은 Next router 또는 Link를 사용한다.

## 3. Fetch lifecycle

아래 상태 묶음은 `useListData` 사용을 우선 검토한다.

- `loading`
- `refreshing`
- `error`
- `rows`
- `meta`
- `requestKeyRef`
- latest request 처리
- 중복 fetch 방지

`useListData`를 사용하는 목록은 도메인별 `cacheNamespace`를 지정한다.

- 기본 메모리 캐시 TTL은 30초다.
- 최대 100개 요청 결과만 유지하고 오래 사용하지 않은 항목부터 제거한다.
- 캐시된 화면도 백그라운드 요청으로 최신 데이터를 다시 확인한다.
- mutation 성공과 로그아웃 시 목록 캐시를 무효화한다.
- 민감한 목록을 영구 저장소나 브라우저 간 공유 캐시에 보관하지 않는다.
- 개발 모드의 effect 재실행은 정리 가능한 예약 호출로 합친다.
- 현재 요청이 취소되면 loading/refreshing을 해제한다. 이미 대체된 과거 요청은 새 요청의 로딩 상태를 변경하지 않는다.

도메인별 endpoint, query field, row mapper는 공통 hook 안에 넣지 않는다.

## 4. 병렬 호출

독립 API는 병렬 호출한다.

예:

- summary
- list
- filter options

금지:

```text
summary 완료 -> options 완료 -> list 호출
```

서로 의존성이 없으면 순차 호출하지 않는다.

## 5. Summary card

summary 카드는 `SummaryCountCard`를 우선 사용한다.

기준:

- 병의원/입점신청/이벤트/광고/동영상/신고게시물 summary 스타일은 동일하게 유지한다.
- 클릭 가능한 summary는 다시 클릭하면 해당 필터를 해제한다.
- summary 클릭 필터도 URL query에 반영한다.
- summary 숫자는 서버 기준을 따른다. 프론트에서 임의 계산하지 않는다.

처리대기 그룹 표시:

- 신청/검수처럼 운영자가 먼저 봐야 하는 행은 필요 시 왼쪽 3px 브랜드 보더 정도로만 강조한다.
- 정렬 자체는 도메인별 정책을 따른다.

## 6. LoadError

목록 테이블 데이터 로드 실패는 `DataTable`의 공통 error row를 사용한다.

기준:

- 테이블 안에서 중앙 정렬한다.
- 에러 문구만 표시한다.
- 취소 버튼을 만들지 않는다.
- 사용자용 수동 새로고침 버튼을 만들지 않는다.
- 도메인별로 별도 error card를 만들지 않는다.

페이지 전체 진입 자체가 실패하는 상세/수정/등록 초기 로드 실패는 `LoadErrorState`를 사용한다.

기준:

- 중앙 정렬
- 제목과 에러 문구만 표시
- 흰 박스 없음
- 취소 버튼 없음
- 다시 불러오기 버튼 없음

## 7. Pagination

페이지네이션은 `packages/ui-admin`의 공통 Pagination을 사용한다.

기준:

- 1페이지뿐이어도 정책상 표시가 필요한 목록은 표시한다.
- refreshing 중 기존 rows를 비우지 않는다.
- 로딩 중 pagination 높이가 튀지 않게 한다.

## 8. 이미지

목록 이미지는 table 렌더를 막으면 안 된다.

금지:

- list API 응답 후 이미지 preload를 `await`해서 table 표시를 늦추는 패턴
- 이미지가 없을 때 `0` 같은 숫자를 placeholder로 표시하는 패턴

이미지가 없으면 공통 기본 이미지 또는 `-`를 사용한다. 어떤 쪽을 쓸지는 도메인 UI 규칙에 따른다.

## 9. 업무 상태와 원장 목록

충전금처럼 신청 상태와 실제 완료 원장이 분리된 도메인은 화면 목적에 맞는 목록 기준을 사용한다.

- 신청/대기/취소까지 표시하는 운영 목록은 Operation API를 조회한다.
- 완료된 잔액 변경만 필요한 회계 검증 화면은 Transaction/Entry 기준 API를 별도로 둔다.
- 프론트에서 완료 원장과 대기 신청을 합쳐서 목록을 만들지 않는다.
- 탭별 컬럼 차이는 DataTable의 column builder에서 처리하고 Client에 조건부 셀 렌더링을 쌓지 않는다.
