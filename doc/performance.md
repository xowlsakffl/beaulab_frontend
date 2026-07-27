# Frontend Performance Rules

작성 기준: 2026-07-27

이 문서는 프론트엔드 성능 기준이다.

## 1. 기본 원칙

- 먼저 데이터가 보이고 이미지는 뒤따라와도 된다.
- 독립 API는 병렬 호출한다.
- 화면 진입 시 같은 option API를 반복 호출하지 않는다.
- 검색어 입력마다 API를 호출하지 않는다.
- layout shift가 보이면 UI 크기를 고정한다.
- 실서버에서 빨라질 것이라고 가정하지 않는다.

## 2. 목록 성능

목록 화면에서 확인할 것:

- summary/list/options가 순차 호출되고 있지 않은가
- list fetch 후 이미지 preload를 기다리고 있지 않은가
- 필터 draft와 applied query가 분리되어 있는가
- `latestKey` 또는 `useListData`로 늦게 도착한 응답을 막는가
- refreshing 중 기존 rows를 비워 화면이 튀지 않는가

## 3. 이미지 성능

기준:

- 목록 이미지는 thumb 또는 적절한 variant를 사용한다.
- 원본 이미지는 상세/원본보기에서만 사용한다.
- 이미지가 없어도 레이아웃 크기는 유지한다.
- 이미지 로드 실패는 공통 기본 이미지 또는 `-` 처리로 통일한다.

## 4. 옵션/selector 캐시

자주 쓰고 자주 바뀌지 않는 option은 request cache를 검토한다.

대상:

- 카테고리 selector
- 병의원 진료과목
- 광고 위치
- 이벤트/병원 검색 option 중 짧은 TTL이 맞는 데이터

구현 기준:

- 카테고리 selector는 `apps/staff-web/lib/common/category-selector.ts`의 `fetchCategorySelectorItems()`를 사용한다.
- 병원/의료진/해시태그처럼 검색형 option은 전용 hook 안에서 debounce, request id, 짧은 TTL 캐시를 함께 처리한다.
- 컴포넌트 파일에 `Map` 캐시를 직접 만들지 않는다. 공통 helper 또는 도메인 option hook으로 뺀다.

주의:

- 권한/상태에 따라 결과가 달라지는 API는 cache key에 조건을 포함한다.
- 저장 직후 바로 최신성이 필요한 데이터는 mutation 성공 후 무효화 기준을 둔다.

## 5. 달력/광고 현황

광고 달력은 계산량과 표시량이 많으므로 다음 기준을 지킨다.

- 월 이동 시 기존 월 뱃지를 새 월 셀에 잠깐 보여주지 않는다.
- loading 중 판매종료/예약가능 상태가 보였다 사라지지 않게 한다.
- 서버 calendar API는 가능한 한 한 번의 요청으로 월 단위 데이터를 내려준다.
- 프론트는 날짜 셀 렌더링만 담당하고, 구좌 확정 기준은 백엔드가 책임진다.

## 6. Memoization

성능 근거 없이 모든 함수를 `useMemo`, `useCallback`으로 감싸지 않는다.

사용 기준:

- 큰 배열 mapping 결과가 반복 렌더마다 비싸다.
- 하위 memo 컴포넌트에 안정적인 reference가 필요하다.
- dependency가 명확하고 stale closure 위험이 낮다.

## 7. 측정 기준

성능 문제는 다음으로 분해한다.

1. API 응답 시간
2. JSON normalize/mapper 시간
3. 이미지 로딩 시간
4. React 렌더 시간
5. 레이아웃 shift
6. 사용자 체감 대기 시간

로컬에서 600ms 이상이면 무조건 문제라고 단정하지 않는다. 하지만 반복 진입 화면에서 1초 이상 체감 지연이 있으면 API/렌더/이미지를 분해해서 본다.
