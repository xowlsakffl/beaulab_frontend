export type QueryValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | (string | number | boolean | null | undefined)[];

export type Query = Record<string, QueryValue>;

export function buildUrl(baseURL: string, path: string, query?: Query): string {
    const url = new URL(
        `${baseURL}${path.startsWith("/") ? path : `/${path}`}`
    );

    if (!query) return url.toString();

    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;

        if (Array.isArray(value)) {
            for (const v of value) {
                if (v === undefined || v === null) continue;
                url.searchParams.append(key, String(v));
            }
            continue;
        }

        url.searchParams.set(key, String(value));
    }

    return url.toString();
}
