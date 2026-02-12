/**
 * 사용법 예)
 * import { isApiSuccess } from "@beaulab/types"; // 또는 api.ts export 위치
 *
 * const res = await staffClient.get<Hospital[]>("/hospitals");
 *
 * if (isApiSuccess(res)) {
 *   console.log(res.data);
 * } else {
 *   console.log(res.error.code, res.error.message, res.traceId);
 * }
 *
 */

/** 서버에서 내려주는 에러 구조 */
export type ApiError = {
    code: string;
    message: string;
    details?: unknown;
};

/** 프로젝트 공통 응답 규약(ApiResponse) */
export type ApiResponse<TData = unknown, TMeta = unknown> =
    | {
    success: true;
    data: TData;
    meta: TMeta | null;
    traceId: string | null;
}
    | {
    success: false;
    error: ApiError;
    traceId: string | null;
};

/** 타입 가드: 성공 응답인지 */
export function isApiSuccess<TData, TMeta>(
    res: ApiResponse<TData, TMeta>
): res is { success: true; data: TData; meta: TMeta | null; traceId: string | null } {
    return res.success === true;
}

/** 타입 가드: 실패 응답인지 */
export function isApiError<TData, TMeta>(
    res: ApiResponse<TData, TMeta>
): res is { success: false; error: ApiError; traceId: string | null } {
    return res.success === false;
}
