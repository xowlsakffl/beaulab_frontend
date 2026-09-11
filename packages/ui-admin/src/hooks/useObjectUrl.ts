"use client";

import { useEffect, useState } from "react";

export function useObjectUrl(file: Blob | null) {
  const [preview, setPreview] = useState<{ file: Blob | null; url: string | null } | null>(null);

  useEffect(() => {
    const url = file ? URL.createObjectURL(file) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Publish the external browser resource after commit; never allocate it during render.
    setPreview({ file, url });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  return preview?.file === file ? preview.url : null;
}
