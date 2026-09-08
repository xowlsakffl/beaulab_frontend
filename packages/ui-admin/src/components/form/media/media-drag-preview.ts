let activeDragPreview: HTMLDivElement | null = null;

export function clearDragPreview() {
  if (!activeDragPreview) {
    return;
  }

  activeDragPreview.remove();
  activeDragPreview = null;
}

export function createDragPreview(sourceNode: HTMLElement, variant: "card" | "compact" = "card") {
  if (typeof document === "undefined") {
    return null;
  }

  clearDragPreview();

  const rect = sourceNode.getBoundingClientRect();
  const clonedNode =
    variant === "compact" ? document.createElement("div") : (sourceNode.cloneNode(true) as HTMLDivElement);

  if (variant === "compact") {
    clonedNode.textContent = "이미지 이동";
    clonedNode.style.display = "flex";
    clonedNode.style.alignItems = "center";
    clonedNode.style.justifyContent = "center";
    clonedNode.style.fontSize = "12px";
    clonedNode.style.fontWeight = "600";
    clonedNode.style.color = "#374151";
    clonedNode.style.background = "rgba(255,255,255,0.94)";
    clonedNode.style.border = "1px solid rgba(209,213,219,0.95)";
    clonedNode.style.borderRadius = "999px";
    clonedNode.style.padding = "8px 12px";
  }

  clonedNode.style.position = "fixed";
  clonedNode.style.top = "-10000px";
  clonedNode.style.left = "-10000px";
  clonedNode.style.width = variant === "compact" ? "88px" : `${rect.width}px`;
  clonedNode.style.height = variant === "compact" ? "36px" : `${rect.height}px`;
  clonedNode.style.pointerEvents = "none";
  clonedNode.style.opacity = variant === "compact" ? "0.92" : "0.68";
  clonedNode.style.transform = variant === "compact" ? "none" : "scale(0.985)";
  clonedNode.style.boxShadow =
    variant === "compact" ? "0 10px 24px rgba(15, 23, 42, 0.16)" : "0 20px 45px rgba(15, 23, 42, 0.18)";
  clonedNode.style.zIndex = "9999";

  document.body.appendChild(clonedNode);
  activeDragPreview = clonedNode;
  return clonedNode;
}
