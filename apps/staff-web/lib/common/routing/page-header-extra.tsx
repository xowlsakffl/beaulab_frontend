"use client";

import React from "react";

type PageHeaderExtraSetter = (extra: React.ReactNode | null) => void;

const PageHeaderExtraContext = React.createContext<PageHeaderExtraSetter | null>(null);

export function PageHeaderExtraProvider({
  children,
  onChange,
}: {
  children: React.ReactNode;
  onChange: PageHeaderExtraSetter;
}) {
  const setExtra = React.useCallback<PageHeaderExtraSetter>((extra) => onChange(extra), [onChange]);

  return (
    <PageHeaderExtraContext.Provider value={setExtra}>
      {children}
    </PageHeaderExtraContext.Provider>
  );
}

export function usePageHeaderExtra(extra: React.ReactNode | null) {
  const setExtra = React.useContext(PageHeaderExtraContext);

  React.useEffect(() => {
    if (!setExtra) {
      return;
    }

    setExtra(extra);

    return () => setExtra(null);
  }, [extra, setExtra]);
}
