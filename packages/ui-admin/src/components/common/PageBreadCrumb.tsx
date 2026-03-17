import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface BreadcrumbProps {
  pageTitle: string;
  homeLabel?: string;
  homeHref?: string;
  items?: BreadcrumbItem[];
}

export function PageBreadcrumb({
  pageTitle,
  homeLabel = "Home",
  homeHref = "/",
  items = [],
}: BreadcrumbProps) {
  const crumbs = [{ label: homeLabel, href: homeHref }, ...items, { label: pageTitle }];

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{pageTitle}</h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;

            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {isLast || !crumb.href ? (
                  <span className="text-sm text-gray-800 dark:text-white/90">{crumb.label}</span>
                ) : (
                  <Link
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                    href={crumb.href}
                  >
                    {crumb.label}
                  </Link>
                )}
                {!isLast ? (
                  <svg
                    className="stroke-current"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
