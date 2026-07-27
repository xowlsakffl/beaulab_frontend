# Frontend Media Rules

작성 기준: 2026-07-27

이 문서는 이미지/파일 업로드와 표시 규칙이다.

## 1. URL 해석

미디어 URL은 `apps/staff-web/lib/common/media.ts`의 `resolveMediaAssetUrl`을 사용한다.

우선순위:

1. 요청한 variant의 직접 URL
2. metadata variants URL/path
3. `media.url`
4. `media.path`
5. storage path 보정

화면에서 `/storage` 경로를 직접 조합하지 않는다.

## 2. 파일 검증

이미지 파일 검증은 `apps/staff-web/lib/common/media-validation.ts`를 사용한다.

검증 가능한 조건:

- 확장자
- MIME type
- 최대 용량
- 정확한 width/height
- 최소 width/height
- 정사각형 여부
- 가로/세로 비율

도메인별 검증 메시지는 도메인 form/helper에 둔다. UI 컴포넌트가 직접 문구를 만들지 않는다.

## 3. Object URL

미리보기용 object URL은 `useObjectUrl`을 사용한다.

규칙:

- `URL.createObjectURL`을 직접 쓰면 revoke 누락 위험이 있다.
- 컴포넌트 unmount나 file 변경 시 이전 URL이 해제되어야 한다.
- 다중 파일도 같은 원칙으로 정리한다.

## 4. 단일 파일

단일 파일 state 기준:

```text
existing_media_id
new_file
remove_file
```

수정 페이지에서 기존 파일을 유지하는 경우 새 파일을 요구하지 않는다. 단, 도메인 정책상 필수 파일이 없으면 validation에서 막는다.

## 5. 다중 이미지

다중 이미지 state 기준:

```text
existing_ids[]
new_files[]
removed_ids[]
order[]
main_id 또는 main_token
```

기존/신규 파일을 섞어 정렬해야 하면 `existing:{id}`, `new:{index}` 같은 명시적 token 기반 order를 사용한다.

## 6. 상세/수정 표시

상세와 수정의 이미지 영역은 같은 비율과 여백을 유지한다.

기준:

- 같은 도메인의 상세/수정 이미지 박스 높이와 패딩을 다르게 만들지 않는다.
- 클릭 가능한 이미지는 모달을 연다.
- 모달 제목은 도메인 표시 기준을 따른다. 파일명만 제목으로 쓰지 않는다.
- 원본보기/미리보기/다운로드 문구를 도메인별로 임의 변경하지 않는다.

## 7. 기본 이미지

이미지가 없을 때 숫자 `0`을 표시하지 않는다.

기준:

- 이미지 영역이면 공통 기본 이미지 사용
- 텍스트 셀이면 `-` 사용
- 실제 이미지가 있는데 URL 해석 실패로 기본 이미지가 나오면 mapper/API 응답부터 점검한다.

## 8. 동영상 썸네일

동영상 썸네일 기준:

- 비율: 16:9
- 최대 용량: 5MB
- 확장자: `.jpg`, `.jpeg`, `.png`
- 상세/수정/등록에서 모두 16:9로 표시
- 불필요한 패딩/배경 없이 이미지가 영역에 맞게 보이도록 한다.

## 9. 금지

- file input UI를 도메인마다 새로 디자인하지 않는다.
- `URL.createObjectURL` 후 revoke 없이 방치하지 않는다.
- 필수 파일 에러를 카드 우측/중앙 등 임의 위치에 표시하지 않는다.
- 이미지 preload를 목록 렌더링의 선행 조건으로 만들지 않는다.
