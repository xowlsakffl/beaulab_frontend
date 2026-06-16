export type VisibilityStatusRow = {
  id: number;
  status: string;
  isVisible: boolean;
  reportStatus?: string;
  reportStatusLabel?: string;
};

export function applyVisibilityStatusToRows<T extends VisibilityStatusRow>(
  rows: T[],
  ids: Iterable<number>,
  status: string,
  visibilityFilter = "",
): T[] {
  const idSet = ids instanceof Set ? ids : new Set(ids);
  const nextRows = rows.map((row) => {
    if (!idSet.has(row.id)) return row;

    const isVisible = status === "ACTIVE";

    return {
      ...row,
      status,
      isVisible,
      reportStatus: isVisible ? "" : "INACTIVE",
      reportStatusLabel: isVisible ? "" : "미노출",
    };
  });

  if (!visibilityFilter) return nextRows;

  return nextRows.filter((row) => row.status === visibilityFilter);
}
