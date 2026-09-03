# Frontend API Rules

작성 기준: 2026-07-27

이 문서는 프론트엔드 API 호출 규칙이다.

## 1. 기본 구조

공통 HTTP client는 `packages/api-client`가 제공하고, staff 전용 client는 `apps/staff-web/lib/common/api.ts`에서 감싼다.

```text
packages/api-client
  -> createClient
  -> token 자동 주입
  -> JSON/FormData 처리
  -> latestKey 요청 취소
  -> unauthorized callback

apps/staff-web/lib/common/api.ts
  -> staff baseURL 고정
  -> 401/419 로그인 이동
  -> mutation 성공 후 메뉴 N 배지 refresh event 발생
  -> 파일 다운로드 helper
```

화면에서는 staff API를 직접 `fetch`로 호출하지 않고 `api`를 사용한다.

## 2. 응답 처리

백엔드는 공통 `ApiResponse` 형태를 반환한다.

```ts
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  traceId?: string | null;
};
```

규칙:

- `success === true`일 때만 `data`를 사용한다.
- `success === false`이면 `error.message`를 사용자 메시지의 기본값으로 사용한다.
- 화면별 fallback 문구는 domain lib 또는 Client에서 명시한다.
- 서버 응답 shape를 UI가 직접 길게 파싱하지 않고 도메인 mapper에서 화면 shape로 변환한다.

## 3. 인증 만료

staff API에서 401 또는 419가 오면 `apps/staff-web/lib/common/api.ts`가 다음 처리를 한다.

1. staff token/session storage 제거
2. 현재 경로를 `next` query로 보존
3. `/login`으로 replace 이동

화면마다 401/419를 별도로 처리하지 않는다. 단, 비밀번호 재설정 토큰 검증처럼 로그인 이동이 맞지 않는 API는 `skipUnauthorizedHandler`를 명시적으로 사용한다.

## 4. Mutation 후처리

staff API의 `post`, `put`, `patch`, `delete`는 성공 시 `staff:navigation-badges:refresh` 이벤트를 발생시킨다.

목적:

- 메뉴명 옆 N 배지 갱신
- 신청/검수/신고/DB 신규 건 처리 후 sidebar 상태 최신화

규칙:

- mutation 성공 후 N 배지 갱신을 화면마다 직접 호출하지 않는다.
- 특수한 후처리가 필요하면 공통 이벤트는 유지하고 도메인 후처리만 추가한다.

## 5. 최신 요청 처리

`createClient`는 `latestKey`를 지원한다.

사용 기준:

- 검색/필터/목록처럼 이전 응답이 나중에 도착하면 화면을 덮어쓰면 안 되는 경우 사용한다.
- 같은 actor와 baseURL 안에서 같은 `latestKey`의 이전 요청은 abort된다.
- 같은 tick에 대체된 요청은 네트워크 호출 전에 취소한다.
- abort된 요청은 `ApiRequestCanceledError`로 구분한다.

GET 요청은 기본 30초 후 오류로 종료한다. `timeoutMs`로 개별 조정할 수 있으며 `0`은 제한 없음이다. 시간 초과는 의도적인 취소가 아니므로 사용자에게 오류를 표시한다. 저장/충전금 처리 등 mutation에는 기본 시간 제한과 자동 재시도를 적용하지 않는다.

목록 화면은 `useListData`와 함께 쓰는 것을 우선 검토한다.

## 6. HTTP status가 필요한 요청

기본 API 메서드는 `ApiResponse`만 반환한다.

HTTP status까지 필요한 특수 요청은 `rawWithResponse`를 사용한다.

현재 사용 기준:

- 비밀번호 재설정 링크 검증처럼 419, 422, 429를 화면 흐름으로 구분해야 하는 경우

규칙:

- 일반 목록/상세/저장 요청에서 `rawWithResponse`를 쓰지 않는다.
- 화면 컴포넌트에서 직접 `fetch`하지 않고 도메인/helper 함수 안에서만 사용한다.
- 401/419 로그인 이동이 맞지 않는 공개 인증 흐름은 `skipUnauthorizedHandler`를 명시한다.

## 7. 파일 다운로드

staff 파일 다운로드는 `downloadFile`을 사용한다.

기준:

- staff token을 붙인다.
- `Content-Disposition` 파일명을 우선 사용한다.
- 401/419는 로그인 이동 처리한다.
- 실패 JSON 응답이면 `error.message`를 우선 사용한다.

## 8. 금지 패턴

```ts
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/staff/...`);
```

위처럼 화면에서 API host와 staff prefix를 직접 조합하지 않는다.

```ts
if (!response.success) {
  alert(response.error?.message);
}
```

브라우저 `alert()`를 쓰지 않는다. 하단 전역 alert나 화면 error state를 사용한다.

```ts
const value = response.data?.foo?.bar?.baz;
```

응답 객체를 UI에서 계속 타고 들어가지 않는다. 도메인 mapper로 화면 row/detail/form shape를 만든다.
