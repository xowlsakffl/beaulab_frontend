"use client";

import React from "react";
import {useSidebar} from "../context";

export function Backdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
      <div
          className="fixed inset-0 z-40 bg-gray-900/50 xl:hidden"
          onClick={toggleMobileSidebar}
      />
  );
}
