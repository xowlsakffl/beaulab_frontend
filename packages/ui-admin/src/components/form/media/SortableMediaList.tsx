"use client";
import React from "react";
import type { MediaListLayout, DropPosition, ScrollAxis } from "./MediaUploader.types";

export function getMediaListClassName(layout: MediaListLayout) {
  if (layout === "horizontal") {
    return "grid auto-cols-[calc((100%_-_2.25rem)_/_4)] grid-flow-col gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pt-2 pb-4 [scrollbar-gutter:stable]";
  }

  return "space-y-3 pt-2";
}

function getMediaListItemClassName(layout: MediaListLayout, itemIndex: number, itemCount: number) {
  if (layout === "horizontal") {
    return "relative min-w-0 will-change-transform";
  }

  return `relative will-change-transform ${itemIndex === 0 ? "pt-4" : ""} ${itemIndex === itemCount - 1 ? "pb-4" : ""}`;
}

function resolveDropPositionWithBias(
  event: React.DragEvent<HTMLElement>,
  itemIndex: number,
  itemCount: number,
  layout: MediaListLayout,
): DropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  const offset = layout === "horizontal" ? event.clientX - rect.left : event.clientY - rect.top;
  const size = layout === "horizontal" ? rect.width : rect.height;

  if (itemIndex === 0) {
    return offset < size * 0.72 ? "before" : "after";
  }

  if (itemIndex === itemCount - 1) {
    return offset < size * 0.28 ? "before" : "after";
  }

  return offset < size / 2 ? "before" : "after";
}

function resolveInsertionIndex(itemIndex: number, position: DropPosition) {
  return position === "before" ? itemIndex : itemIndex + 1;
}

function reorderItemsByInsertionIndex<T>(items: T[], draggedIndex: number, insertionIndex: number) {
  if (draggedIndex < 0 || draggedIndex >= items.length || insertionIndex < 0 || insertionIndex > items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(draggedIndex, 1);
  let insertIndex = insertionIndex;
  if (draggedIndex < insertIndex) {
    insertIndex -= 1;
  }

  nextItems.splice(insertIndex, 0, movedItem);
  return nextItems;
}

function useMediaListLayoutAnimation(itemKeys: string[], layout: MediaListLayout) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const previousRectsRef = React.useRef<Map<string, DOMRect>>(new Map());
  const keySignature = itemKeys.join("|");

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nextItems = measureMediaListItemLayouts(container);
    const shouldReduceMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!shouldReduceMotion) {
      nextItems.forEach(({ element, rect }, key) => {
        const previousRect = previousRectsRef.current.get(key);
        if (!previousRect) return;

        const deltaX = previousRect.left - rect.left;
        const deltaY = layout === "horizontal" ? 0 : previousRect.top - rect.top;
        if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

        element.getAnimations().forEach((animation) => animation.cancel());
        element.animate([{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: "translate(0, 0)" }], {
          duration: 220,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        });
      });
    }

    previousRectsRef.current = new Map(Array.from(nextItems.entries()).map(([key, item]) => [key, item.rect]));
  }, [keySignature, layout]);

  return containerRef;
}

function measureMediaListItemLayouts(container: HTMLElement) {
  const items = new Map<string, { element: HTMLElement; rect: DOMRect }>();

  container.querySelectorAll<HTMLElement>("[data-media-list-token]").forEach((element) => {
    const key = element.dataset.mediaListToken;
    if (!key) return;

    items.set(key, {
      element,
      rect: element.getBoundingClientRect(),
    });
  });

  return items;
}

function DropIndicator({ position, layout }: { position: DropPosition; layout: MediaListLayout }) {
  if (layout === "horizontal") {
    return (
      <div
        className={`pointer-events-none absolute inset-y-3 z-20 ${position === "before" ? "-left-1.5" : "-right-1.5"}`}
        aria-hidden="true"
      >
        <div className="flex h-full flex-col items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.18)]" />
          <span className="w-1 flex-1 rounded-full bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.12)]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-3 z-20 ${position === "before" ? "-top-1.5" : "-bottom-1.5"}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.18)]" />
        <span className="h-1 flex-1 rounded-full bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.12)]" />
      </div>
    </div>
  );
}

function getScrollContainer(node: HTMLElement | null, axis: ScrollAxis): HTMLElement | Window {
  if (typeof window === "undefined") {
    return window;
  }

  let currentNode = node ?? null;

  while (currentNode) {
    const style = window.getComputedStyle(currentNode);
    const overflow = axis === "x" ? style.overflowX : style.overflowY;
    const canScroll =
      (overflow === "auto" || overflow === "scroll") &&
      (axis === "x"
        ? currentNode.scrollWidth > currentNode.clientWidth
        : currentNode.scrollHeight > currentNode.clientHeight);

    if (canScroll) {
      return currentNode;
    }

    currentNode = currentNode.parentElement;
  }

  return window;
}

function autoScrollDuringDrag(event: React.DragEvent<HTMLElement>, layout: MediaListLayout) {
  if (typeof window === "undefined") {
    return;
  }

  if (layout === "horizontal") {
    autoScrollHorizontalContainerDuringDrag(event);
    return;
  }

  const threshold = 120;
  const maxStep = 20;
  const scrollContainer = getScrollContainer(event.currentTarget, "y");

  if (scrollContainer === window) {
    return;
  }

  const scrollElement = scrollContainer as HTMLElement;
  const rect = scrollElement.getBoundingClientRect();
  const topDistance = event.clientY - rect.top;
  const bottomDistance = rect.bottom - event.clientY;

  if (topDistance < threshold) {
    const velocity = Math.ceil(((threshold - topDistance) / threshold) * maxStep);
    scrollElement.scrollTop -= velocity;
    return;
  }

  if (bottomDistance < threshold) {
    const velocity = Math.ceil(((threshold - bottomDistance) / threshold) * maxStep);
    scrollElement.scrollTop += velocity;
  }
}

function autoScrollHorizontalContainerDuringDrag(event: React.DragEvent<HTMLElement>) {
  const threshold = 96;
  const maxStep = 18;
  const scrollContainer = getScrollContainer(event.currentTarget, "x");

  if (scrollContainer === window) {
    return;
  }

  const scrollElement = scrollContainer as HTMLElement;
  const rect = scrollElement.getBoundingClientRect();
  const leftDistance = event.clientX - rect.left;
  const rightDistance = rect.right - event.clientX;

  if (leftDistance < threshold) {
    const velocity = Math.ceil(((threshold - leftDistance) / threshold) * maxStep);
    scrollElement.scrollLeft -= velocity;
    return;
  }

  if (rightDistance < threshold) {
    const velocity = Math.ceil(((threshold - rightDistance) / threshold) * maxStep);
    scrollElement.scrollLeft += velocity;
  }
}

function autoScrollWindowByClientY(clientY: number) {
  if (typeof window === "undefined") {
    return;
  }

  const topThreshold = 180;
  const bottomThreshold = 140;
  const maxStep = 20;
  const topDistance = clientY;
  const bottomDistance = window.innerHeight - clientY;

  if (topDistance < topThreshold) {
    const velocity = Math.ceil(((topThreshold - topDistance) / topThreshold) * maxStep);
    window.scrollBy(0, -velocity);
    return;
  }

  if (bottomDistance < bottomThreshold) {
    const velocity = Math.ceil(((bottomThreshold - bottomDistance) / bottomThreshold) * maxStep);
    window.scrollBy(0, velocity);
  }
}

function useWindowAutoScrollWhileDragging(enabled: boolean) {
  const latestClientYRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let frameId = 0;

    const tick = () => {
      const clientY = latestClientYRef.current;
      if (clientY !== null) {
        autoScrollWindowByClientY(clientY);
      }

      frameId = window.requestAnimationFrame(tick);
    };

    const handleDragOver = (event: DragEvent) => {
      latestClientYRef.current = event.clientY;
    };

    frameId = window.requestAnimationFrame(tick);
    window.addEventListener("dragover", handleDragOver);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.cancelAnimationFrame(frameId);
      latestClientYRef.current = null;
    };
  }, [enabled]);
}

type DragState = { isDragging: boolean; onDragStart: () => void; onDragEnd: () => void };

export function SortableMediaList<T>({
  items,
  getKey,
  layout,
  onReorder,
  children,
}: {
  items: T[];
  getKey: (item: T) => string;
  layout: MediaListLayout;
  onReorder: (items: T[]) => void;
  children: (item: T, index: number, drag: DragState) => React.ReactNode;
}) {
  const [draggedKey, setDraggedKey] = React.useState<string | null>(null);
  const [dropInsertionIndex, setDropInsertionIndex] = React.useState<number | null>(null);
  const itemKeys = React.useMemo(() => items.map(getKey), [items, getKey]);
  const listRef = useMediaListLayoutAnimation(itemKeys, layout);
  useWindowAutoScrollWhileDragging(layout !== "horizontal" && draggedKey !== null);
  const endDrag = () => {
    setDraggedKey(null);
    setDropInsertionIndex(null);
  };
  return (
    <div
      ref={listRef}
      className={getMediaListClassName(layout)}
      onDragOver={(event) => {
        if (draggedKey === null) return;
        event.preventDefault();
        autoScrollDuringDrag(event, layout);
      }}
    >
      {items.map((item, index) => {
        const key = getKey(item);
        return (
          <div
            key={key}
            data-media-list-token={key}
            className={getMediaListItemClassName(layout, index, items.length)}
            onDragOver={(event) => {
              if (draggedKey === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              autoScrollDuringDrag(event, layout);
              setDropInsertionIndex(
                resolveInsertionIndex(index, resolveDropPositionWithBias(event, index, items.length, layout)),
              );
            }}
            onDrop={(event) => {
              if (draggedKey === null) return;
              event.preventDefault();
              const draggedIndex = items.findIndex((candidate) => getKey(candidate) === draggedKey);
              if (draggedIndex >= 0 && draggedKey !== key) {
                const insertionIndex = resolveInsertionIndex(
                  index,
                  resolveDropPositionWithBias(event, index, items.length, layout),
                );
                onReorder(reorderItemsByInsertionIndex(items, draggedIndex, insertionIndex));
              }
              endDrag();
            }}
          >
            {dropInsertionIndex !== null &&
            draggedKey !== null &&
            draggedKey !== key &&
            (dropInsertionIndex === index || (index === items.length - 1 && dropInsertionIndex === index + 1)) ? (
              <DropIndicator position={dropInsertionIndex === index ? "before" : "after"} layout={layout} />
            ) : null}
            {children(item, index, {
              isDragging: draggedKey === key,
              onDragStart: () => setDraggedKey(key),
              onDragEnd: endDrag,
            })}
          </div>
        );
      })}
    </div>
  );
}
