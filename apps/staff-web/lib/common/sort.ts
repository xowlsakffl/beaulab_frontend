export type TableSortState<Field extends string> = {
  field: Field;
  direction: "asc" | "desc";
  enabled: boolean;
};

export function cycleTableSort<Field extends string>(
  previous: TableSortState<Field>,
  field: Field,
  fallback: TableSortState<Field>,
): TableSortState<Field> {
  if (previous.field !== field) return { field, direction: "desc", enabled: true };
  if (previous.enabled && previous.direction === "desc") return { field, direction: "asc", enabled: true };
  if (previous.enabled && previous.direction === "asc") return { ...fallback, enabled: false };
  return { field, direction: "desc", enabled: true };
}
