import type { ReactNode } from "react";

export type UserInfoItem = {
  label: string;
  value: ReactNode;
};

export type UserInfoCardProps = {
  title?: string;
  items: UserInfoItem[];
  actions?: ReactNode;
  emptyText?: string;
};

export default function UserInfoCard({
  title = "기본 정보",
  items,
  actions,
  emptyText = "표시할 정보가 없습니다.",
}: UserInfoCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">{title}</h4>

          {items.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              {items.map((item) => (
                <div key={item.label}>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{item.label}</p>
                  <div className="text-sm font-medium text-gray-800 dark:text-white/90">{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
          )}
        </div>

        {actions ? <div className="w-full lg:w-auto">{actions}</div> : null}
      </div>
    </div>
  );
}
