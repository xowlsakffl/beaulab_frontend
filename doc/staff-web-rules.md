# Staff Web Rules

작성 기준: 2026-06-29

이 문서는 `apps/staff-web`에서 지켜야 할 리팩토링/구조/구현 규칙이다.

## 1. 공통 원칙

- 현재 코드와 이 문서가 기준이다.
- 추상화는 변경 비용을 실제로 줄일 때만 만든다.
- 병의원, 의료진, 이벤트처럼 이미 패턴이 있는 화면은 기존 패턴을 먼저 따른다.
- 새 구조를 만들기 전에 `hospital`, `doctor`, `hospital-event`, `common`의 위치와 책임을 확인한다.
- 문서와 코드가 다르면 코드를 기준으로 문서를 즉시 갱신한다.

## 2. Route / 폴더 규칙

### 2.1 route group

`app/(admin)/(pages)` 아래 route group은 아래 3개만 사용한다.

- `(common)`
- `(hospital)`
- `(beauty)`

기능명 기준 route group `(wallet)`, `(ads)`, `(posts)`처럼 잘게 쪼개지 않는다. URL prefix는 실제 메뉴 상위 그룹 기준으로 둔다.

현재 기준:

- 병의원 관리: `/hospital-manage/*`
- 동영상 관리: `/video-manage/*`
- 이벤트 관리: `/ads-manage/events/*`
- 고객 DB 관리: `/customer-db-manage/*`
- 게시물 관리: `/post-manage/*`
- 신고게시물 관리: `/reported-post-manage/*`
- 공지사항 관리: `/notice-manage/*`
- 회원 관리: `/user-manage/*`
- 카테고리/해시태그 관리: `/category-hashtag-manage/*`
- 관리자 설정: `/admin-settings/*`
- 뷰티 placeholder: `/beauty-*`

API endpoint와 URL prefix는 다를 수 있다. 프론트 URL은 메뉴 기준이고, API path는 백엔드 리소스 기준이다.

### 2.2 `common`의 의미

`apps/staff-web`에서 `common`은 staff 관리자 앱 전체 공통을 뜻한다.

`common`으로 올릴 수 있는 것:

- guard, sidebar, auth session, route permission
- LoadErrorState, operation history display, status/visibility 공통 UI
- object URL, media validation, request cache 같은 도메인 비의존 helper

`common`으로 올리면 안 되는 것:

- 특정 endpoint만 호출하는 코드
- 특정 field key를 아는 validation/focus
- 병의원/의료진/이벤트 같은 도메인 화면 문구와 payload

### 2.3 `lib/common` 구조

`lib/common`은 평면으로 계속 쌓지 않는다.

현재 기준:

- `auth/`
- `routing/`
- `navigation/`
- 그 외 작은 helper는 책임이 명확할 때만 root에 둔다.

## 3. 컴포넌트 분리 규칙

### 3.1 폼은 섹션 단위

폼은 섹션 단위까지만 분리한다.

예:

- 병의원: 기본정보 / 사업자·계좌정보 / 미디어 / 인증 계정 정보 / 검수상태
- 의료진: 기본정보 / 시술분야 / 의사정보 / 미디어 / 검수상태
- 이벤트: 기본정보 / 카테고리·의료진 / 옵션 / 이미지 / 게시·검수상태
- 공지사항: 메인 정보 / 첨부파일
- 동영상: 기본정보 / 카테고리 / 배포정보 / 파일업로드

### 3.2 목록은 toolbar / filter / table 기준

목록 기능은 보통 아래까지만 분리한다.

- `*Toolbar`
- `*FilterPanel`
- `*DataTable`
- 필요한 경우 상태 변경 modal

FilterPanel과 DataTable에서는 API 호출, router 이동, 서버 응답 파싱을 하지 않는다.

### 3.3 추가 분리 조건

아래 중 하나가 명확할 때만 추가 파일로 뺀다.

- 비동기 로직이 독립적으로 존재한다.
- 상태가 부모와 별개로 유지된다.
- 두 군데 이상에서 실제로 재사용된다.
- Client가 너무 커져서 책임 단위가 보이지 않는다.

줄 수만 줄이기 위한 분리는 금지한다.

## 4. Hook 규칙

### 4.1 `hooks/common`

아래 조건을 모두 만족해야 한다.

- 도메인 이름 없이 설명 가능
- endpoint나 field name에 묶이지 않음
- 여러 도메인에서 같은 의미로 사용 가능

현재 예:

- `useListData`
- `useCategorySelectorLoader`
- `useDaumPostcode`
- `useFormFieldFocus`
- `useObjectUrl`
- `useGoBack`

### 4.2 도메인 hook

아래는 도메인 hook으로 둔다.

- `hospital_id`, `feature_ids`, `allow_status`처럼 특정 field를 직접 아는 hook
- 특정 endpoint만 호출하는 hook
- 특정 DOM target selector를 아는 hook
- 도메인 미디어 상태를 create/edit에서 공유하는 hook

예:

- `useHospitalAddressSearch`
- `useHospitalFeatureList`
- `useHospitalFieldFocus`
- `useDoctorHospitalOptions`
- `useDoctorMediaState`
- `useHospitalEventMediaState`
- `useVideoHospitalOptions`
- `useVideoDoctorOptions`

### 4.3 Hook이 아닌 것은 `lib`

상태와 side effect가 없으면 hook으로 만들지 않는다.

예:

- query string builder
- mapper
- formatter
- payload builder
- validation
- returnTo path 조립

## 5. `lib` 규칙

### 5.1 `lib/common`

다음만 둔다.

- API client
- auth/session
- routing definition
- navigation helper
- request cache
- 공통 media/status/visibility helper

### 5.2 도메인 `lib`

도메인 `lib/{domain}`에는 다음만 둔다.

- form 기본값
- option 상수
- 타입
- validation
- error mapping
- detail/list mapper
- query builder
- payload/FormData builder

페이지 상태, router, modal, API submit orchestration은 넣지 않는다.

## 6. 목록 페이지 규칙

### 6.1 상태 책임

- `*TableClient.tsx`: URL state, fetch orchestration, page action, row 선택 상태
- `*FilterPanel.tsx`: draft filter UI와 입력 변경
- `*DataTable.tsx`: row 렌더링, 정렬 클릭, 행 액션
- `lib/{domain}/list.ts`: query parse/build, row mapper, formatter, option 상수

### 6.2 URL / 검색 / 필터

- 검색/필터/정렬/페이지/per_page는 URL과 동기화한다.
- 새로고침 후 현재 목록 문맥이 복원되어야 한다.
- 상세 진입 시 `returnTo`를 유지한다.
- 등록/수정 후 복귀 시 `highlight`로 해당 행을 강조한다.
- 검색어 입력과 실제 applied query를 분리한다.
- 입력 key stroke마다 목록 API를 호출하지 않는다.
- 탭이 한 화면에 있으면 탭별 필터 상태를 공유하지 않는다.

### 6.3 공통 fetch lifecycle

아래 패턴은 `useListData` 사용을 우선 검토한다.

- `loading / refreshing / error / rows / meta`
- `requestKeyRef`
- latest request key 처리
- 중복 fetch 방지
- 수동 새로고침

단, 도메인별 query field와 row mapper는 공통 hook 안에 넣지 않는다.

### 6.4 LoadError UI

- load error는 `LoadErrorState`를 사용한다.
- 문구와 다시 불러오기 버튼만 중앙에 배치한다.
- 흰 박스, 취소 버튼, 페이지별 제각각 스타일은 만들지 않는다.

## 7. 등록/수정 폼 규칙

### 7.1 파일 책임

| 위치                                           | 책임                                                 | 금지                             |
| ---------------------------------------------- | ---------------------------------------------------- | -------------------------------- |
| `page.tsx`                                     | metadata, params 전달, Client 렌더                   | 상태, API, validation            |
| `*CreateFormClient.tsx`, `*EditFormClient.tsx` | 화면 흐름 조립, 초기 로드, submit 호출, 성공 후 이동 | 도메인 순수 로직 장문 구현       |
| `lib/{domain}/form.ts`                         | 타입, 초기값, validation, normalize, payload builder | React state, API 호출, router    |
| `components/{domain}/form/*Section.tsx`        | 섹션 UI 렌더링                                       | API 호출, submit, 서버 응답 파싱 |
| `hooks/{domain}/use*MediaState.ts`             | 반복 미디어 상태                                     | API submit                       |

### 7.2 Form state

- form 값은 하나의 `form` object를 기본으로 둔다.
- file, existing media, selected category item처럼 form field가 아닌 UI 보조 상태는 별도 state로 둔다.
- 서버 응답을 그대로 state로 들고 다니지 않고 form shape로 변환한다.
- 기존값 비교가 필요하면 `initialForm`, `initialMediaId`, `initialOrder`처럼 비교 대상만 보관한다.

### 7.3 Submit

순서는 고정한다.

```text
validate -> payload build -> api call -> success/error handling
```

- `new FormData()`는 Client에 길게 만들지 않고 도메인 payload builder를 우선 사용한다.
- `isSubmitting`은 중복 클릭 방지와 버튼 disabled에 연결한다.
- 성공 후 이동은 Client가 결정한다.
- 성공 후 목록 복귀는 `returnTo`와 `highlight` 규칙을 지킨다.

### 7.4 Validation

- validation은 side effect 없는 pure function이어야 한다.
- validation 함수에서 API, router, DOM, alert, modal을 사용하지 않는다.
- error key는 실제 form field key와 일치시킨다.
- field focus 순서는 명시적 배열로 관리한다.
- UI 컴포넌트에서 필수 문구를 임의로 만들지 않는다.
- 서버와 맞아야 하는 최소/최대 개수, 파일 조건, 날짜 순서는 백엔드와 이름/조건을 맞춘다.

## 8. Media 규칙

- 파일 검증 규칙과 메시지는 UI 컴포넌트가 아니라 domain form/helper에 둔다.
- create/edit 반복 미디어 상태는 도메인 `use*MediaState`로 묶는다.
- `URL.createObjectURL`과 revoke는 `useObjectUrl`을 사용한다.
- 기존/신규 파일은 `existing`, `new`, `order`, `main` 상태를 명확히 분리한다.
- 단일 파일은 `existing_*_id + new file`을 기본으로 한다.
- 다중 파일은 `existing_*_ids[] + new files[]`를 기본으로 한다.
- 기존/신규를 섞어 정렬하거나 대표를 바꿔야 하면 `gallery_order[]` 같은 명시적 순서 payload를 쓴다.
- 병의원 갤러리는 `existing:{id}` / `new:{index}` 토큰 기반 `gallery_order[]`를 사용한다.
- 동영상 원본 파일은 staff가 교체하지 않는다. 삭제만 `remove_video_file`로 처리한다.
- 원본보기/미리보기/다운로드 문구는 도메인별로 임의 변경하지 않는다.

## 9. UI 규칙

### 9.1 관리자 shell / 사이드바

- 사이드바의 병의원/뷰티 toggle 상태와 메뉴 조합은 `apps/staff-web`가 소유한다.
- `packages/ui-admin` 사이드바에는 앱 전용 도메인 개념을 넣지 않는다.
- 사이드바 메뉴는 도메인 전용 영역과 공통 영역을 분리한다.
- 최종 렌더링에서도 `main`은 도메인 메뉴, `others`는 공통 메뉴로 유지한다.
- logo href는 권한상 접근 가능한 첫 메뉴로 연결한다.

### 9.2 상태 UI

- 병원/의료진/이벤트/입점신청/광고 `allow_status` 표기는 `신청`/`검수`/`승인`/`반려`다.
- `allow_status` 배지 색상은 `신청=파랑(info)`, `검수=운영중지와 동일한 주황(warning)`, `승인=초록(success)`, `반려=빨강(error)`으로 통일한다.
- 신고상태의 `신고접수` 배지는 노랑 배경과 검은 글씨를 사용한다.
- 현재 상태 버튼은 비활성 처리하고, 노출/미노출 버튼 패턴과 같은 기준을 따른다.
- 상태 변경 modal은 도메인별로 새로 만들기 전에 기존 상태 변경 modal/controls 패턴을 확인한다.
- 반려 처리는 반려사유 입력/표시를 병의원 패턴과 맞춘다.

### 9.3 알림/로딩/선택

- 브라우저 `alert()` 금지
- 성공/실패 피드백은 하단 전역 alert 사용
- 페이지/섹션 로딩은 spinner 사용
- status / allow_status / approval 류는 기존 Select 또는 공통 status control 패턴을 우선 재사용
- 설명이 붙는 boolean 설정은 `FormSettingToggleRow`를 우선 재사용

### 9.4 운영 히스토리

- 운영 히스토리 응답은 `changes` 배열을 우선 사용한다.
- `field`, `before_value`, `after_value`는 백엔드 호환 필드로만 본다.
- 표시값은 `field_label`, `before_display`, `after_display`를 우선 사용한다.
- JSON 원본 값이 그대로 보이면 백엔드 history display 값을 먼저 보완한다.
- 히스토리 페이지네이션 중 기존 목록을 비워 스크롤이 튀게 만들지 않는다.

## 10. 성능 규칙

### 10.1 기본

- 먼저 데이터가 보이고, 이미지는 뒤따라와도 된다.
- 독립 API는 병렬 요청한다.
- 같은 option/list API를 한 화면에서 반복 호출하지 않는다.
- 필터 option API는 `request-cache.ts` 또는 상위 상태를 우선 검토한다.
- 초기 렌더링에 필요 없는 계산은 사용자 액션 시점으로 미룬다.
- 성능 근거 없이 모든 함수를 memoize하지 않는다.

### 10.2 금지

- list fetch 후 이미지 preload를 `await`해서 table 렌더를 늦추는 패턴
- 검색 입력 key stroke마다 list API 호출
- 같은 route 진입 때 summary/list/options를 불필요하게 순차 호출하는 패턴
- section UI 안에서 option API를 각각 호출하는 패턴
- layout shift를 방치하는 이미지/카드 UI
- Client 컴포넌트 하나에 table, modal, form, media preview, validation을 전부 몰아넣는 구조

### 10.3 측정

- 성능 개선 전후는 Network, React 렌더, 사용자 체감을 분리해서 본다.
- 로컬 목록 새로고침이 느리면 API 시간, normalize 시간, 이미지 대기, 렌더 비용을 분해한다.
- 실서버에서 빨라질 것이라고 가정하지 않는다.

## 11. 권한 규칙

- 메뉴 노출과 route 보호는 같은 permission 기준을 공유한다.
- 서버 권한 검증을 프론트가 대체하지 않는다.
- 정적 관리자 경로 permission source는 `lib/common/routing/route-permissions.ts`에 둔다.
- 동적 route 매칭도 `route-permissions.ts`가 소유한다.
- 사이드바는 path별 permission string을 흩뿌리지 말고 route permission helper를 참조한다.
- 신규 route 권한은 fail-closed가 기본이다.
- 권한 매핑이 없으면 접근 불가가 맞다.
- `common.access`는 도메인 권한을 대체하지 않는다.

## 12. Prettier / 검증 규칙

- 포맷은 Prettier를 사용한다.
- Tailwind class 정렬은 `prettier-plugin-tailwindcss`를 사용한다.
- 문서/코드 변경 후 최소 `pnpm format:check`, `pnpm lint`, `pnpm typecheck`를 확인한다.
- 배포 전에는 `pnpm build`까지 확인한다.

명령:

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

## 13. 문서 갱신 규칙

아래 중 하나가 바뀌면 문서도 같이 갱신한다.

- 폴더 구조
- route prefix
- common 경계
- 권한 구조
- create/edit/list 공통 패턴
- 관리자 shell 구조
- form/list/media/permission/performance 공통 패턴
- 백엔드 응답 계약과 프론트 mapper 계약

갱신 대상:

- [architecture.md](/root/beaulab_frontend/doc/architecture.md)
- [staff-web-rules.md](/root/beaulab_frontend/doc/staff-web-rules.md)
- 필요 시 [README.md](/root/beaulab_frontend/README.md)

## 14. 작업 전 체크리스트

- 이 코드가 `common`인지 도메인 전용인지 명확한가
- 새 파일 분리가 섹션 단위인지, 과분리인지 확인했는가
- 기존 Select, MediaUploader, spinner, alert, status control 패턴을 먼저 봤는가
- 목록 문맥(`returnTo`, `highlight`, URL query`)을 깨지 않았는가
- form state, API submit, validation, media, section UI 책임이 섞이지 않았는가
- 목록/상세/폼에서 불필요한 직렬 요청이나 렌더 blocking 작업이 없는가
- 신규 route 권한이 fail-closed 기준으로 매핑되어 있는가
- 문서 갱신이 필요한 변경인지 확인했는가
