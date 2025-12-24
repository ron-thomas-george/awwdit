import type {
  PanelToContentMessage,
  SelectedElementPayload,
  PageInsightsPayload,
  ElementStyles
} from "@/lib/messages";

let inspectEnabled = false;
let showHoverCard = true;
let currentElement: HTMLElement | null = null;
let lastHoverData: { element: HTMLElement; x: number; y: number } | null = null;
let panelContainer: HTMLDivElement | null = null;
let panelIframe: HTMLIFrameElement | null = null;
let panelVisible = false;
let desiredInspectEnabled = true;
let tabIdCache: number | undefined;
let dragState: { pointerStartScreenX: number; panelStartLeft: number; anchorTop: number } | null = null;

const PANEL_CONTAINER_ID = "awwdit-panel-container";
const PANEL_IFRAME_ID = "awwdit-panel-frame";

const highlight = document.createElement("div");
Object.assign(highlight.style, {
  position: "fixed",
  pointerEvents: "none",
  zIndex: "2147483642",
  border: "2px solid #36C10C",
  background: "rgba(54, 193, 12, 0.005)",
  borderRadius: "0px",
  transition: "all 80ms ease",
  display: "none"
});

const selectionOverlay = document.createElement("div");
Object.assign(selectionOverlay.style, {
  position: "fixed",
  pointerEvents: "none",
  zIndex: "2147483643",
  border: "2px solid #111111",
  borderRadius: "0px",
  boxShadow: "0 0 0 2px rgba(17,17,17,0.08)",
  display: "none"
});

function createMeasurementLine() {
  const line = document.createElement("div");
  const label = document.createElement("span");
  Object.assign(line.style, {
    position: "fixed",
    pointerEvents: "none",
    zIndex: "2147483644",
    display: "none"
  });
  Object.assign(label.style, {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    background: "#0f172a",
    color: "#e2fbe2",
    borderRadius: "999px",
    padding: "2px 8px",
    fontSize: "11px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    boxShadow: "0 6px 16px rgba(15,23,42,0.25)"
  });
  line.appendChild(label);
  return { line, label };
}

const horizontalMeasurement = createMeasurementLine();
horizontalMeasurement.line.style.height = "1px";
horizontalMeasurement.line.style.borderTop = "1px dashed #36C10C";

const verticalMeasurement = createMeasurementLine();
verticalMeasurement.line.style.width = "1px";
verticalMeasurement.line.style.borderLeft = "1px dashed #36C10C";
verticalMeasurement.label.style.transform = "translate(-100%, -50%)";

const hoverCard = document.createElement("div");
Object.assign(hoverCard.style, {
  position: "fixed",
  pointerEvents: "none",
  zIndex: "2147483643",
  padding: "12px 14px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.95)",
  boxShadow: "0 18px 40px rgba(15,23,42,0.25)",
  minWidth: "200px",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: "12px",
  color: "#0f172a",
  display: "none"
});

const spacingOverlay = document.createElement("div");
Object.assign(spacingOverlay.style, {
  position: "fixed",
  pointerEvents: "none",
  zIndex: "2147483641",
  display: "none",
  background: "rgba(54,193,12,0.004)",
  borderRadius: "10px"
});

const paddingOverlay = document.createElement("div");
Object.assign(paddingOverlay.style, {
  position: "absolute",
  background: "rgba(16,185,129,0.04)",
  borderRadius: "8px"
});

const contentOverlay = document.createElement("div");
Object.assign(contentOverlay.style, {
  position: "absolute",
  background: "rgba(255,255,255,0.15)",
  borderRadius: "6px",
  border: "1px dashed rgba(15,23,42,0.12)"
});

paddingOverlay.appendChild(contentOverlay);
spacingOverlay.appendChild(paddingOverlay);

document.documentElement.appendChild(highlight);
document.documentElement.appendChild(selectionOverlay);
document.documentElement.appendChild(hoverCard);
document.documentElement.appendChild(spacingOverlay);
horizontalMeasurement.line.appendChild(horizontalMeasurement.label);
document.documentElement.appendChild(horizontalMeasurement.line);
verticalMeasurement.line.appendChild(verticalMeasurement.label);
document.documentElement.appendChild(verticalMeasurement.line);

const colorCanvas = document.createElement("canvas");
const colorContext = colorCanvas.getContext("2d");

function updateSelectionOverlay(element: HTMLElement | null) {
  if (!element || !element.isConnected) {
    selectionOverlay.style.display = "none";
    return;
  }
  const rect = element.getBoundingClientRect();
  selectionOverlay.style.display = "block";
  selectionOverlay.style.top = `${rect.top}px`;
  selectionOverlay.style.left = `${rect.left}px`;
  selectionOverlay.style.width = `${rect.width}px`;
  selectionOverlay.style.height = `${rect.height}px`;
}

function hideMeasurements() {
  horizontalMeasurement.line.style.display = "none";
  verticalMeasurement.line.style.display = "none";
}

function updateMeasurementGuides(selectedElement: HTMLElement, hoverRect: DOMRect) {
  if (!selectedElement.isConnected) {
    hideMeasurements();
    return;
  }
  const selectedRect = selectedElement.getBoundingClientRect();
  const horizontalShown = renderHorizontalMeasurement(selectedRect, hoverRect);
  const verticalShown = renderVerticalMeasurement(selectedRect, hoverRect);
  if (!horizontalShown && !verticalShown) {
    hideMeasurements();
  }
}

function renderHorizontalMeasurement(selectedRect: DOMRect, hoverRect: DOMRect) {
  const gapToRight = hoverRect.left - selectedRect.right;
  const gapToLeft = selectedRect.left - hoverRect.right;
  let startX: number | null = null;
  let endX: number | null = null;

  if (gapToRight > 0) {
    startX = selectedRect.right;
    endX = hoverRect.left;
  } else if (gapToLeft > 0) {
    startX = hoverRect.right;
    endX = selectedRect.left;
  } else {
    horizontalMeasurement.line.style.display = "none";
    return false;
  }

  const width = Math.round(Math.abs(endX - startX));
  if (width < 1) {
    horizontalMeasurement.line.style.display = "none";
    return false;
  }

  const midY = computeAlignedCoordinate(selectedRect.top, selectedRect.bottom, hoverRect.top, hoverRect.bottom);
  const top = clamp(midY, 16, window.innerHeight - 16);
  horizontalMeasurement.line.style.display = "block";
  horizontalMeasurement.line.style.left = `${Math.min(startX, endX)}px`;
  horizontalMeasurement.line.style.width = `${width}px`;
  horizontalMeasurement.line.style.top = `${top}px`;
  horizontalMeasurement.label.textContent = `${width}px`;
  horizontalMeasurement.label.style.left = `${width / 2}px`;
  horizontalMeasurement.label.style.top = "-14px";
  return true;
}

function renderVerticalMeasurement(selectedRect: DOMRect, hoverRect: DOMRect) {
  const gapBelow = hoverRect.top - selectedRect.bottom;
  const gapAbove = selectedRect.top - hoverRect.bottom;
  let startY: number | null = null;
  let endY: number | null = null;

  if (gapBelow > 0) {
    startY = selectedRect.bottom;
    endY = hoverRect.top;
  } else if (gapAbove > 0) {
    startY = hoverRect.bottom;
    endY = selectedRect.top;
  } else {
    verticalMeasurement.line.style.display = "none";
    return false;
  }

  const height = Math.round(Math.abs(endY - startY));
  if (height < 1) {
    verticalMeasurement.line.style.display = "none";
    return false;
  }

  const midX = computeAlignedCoordinate(selectedRect.left, selectedRect.right, hoverRect.left, hoverRect.right);
  const left = clamp(midX, 16, window.innerWidth - 16);
  verticalMeasurement.line.style.display = "block";
  verticalMeasurement.line.style.left = `${left}px`;
  verticalMeasurement.line.style.height = `${height}px`;
  verticalMeasurement.line.style.top = `${Math.min(startY, endY)}px`;
  verticalMeasurement.label.textContent = `${height}px`;
  verticalMeasurement.label.style.left = "0px";
  verticalMeasurement.label.style.top = `${height / 2}px`;
  return true;
}

function computeAlignedCoordinate(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  const overlapStart = Math.max(aStart, bStart);
  const overlapEnd = Math.min(aEnd, bEnd);
  if (overlapStart <= overlapEnd) {
    return overlapStart + (overlapEnd - overlapStart) / 2;
  }
  const centerA = aStart + (aEnd - aStart) / 2;
  const centerB = bStart + (bEnd - bStart) / 2;
  return (centerA + centerB) / 2;
}

function handleDragMessage(event: MessageEvent) {
  const data = event.data as {
    __awwditDrag?: boolean;
    phase?: "start" | "move" | "end";
    clientX?: number;
    clientY?: number;
    screenX?: number;
    screenY?: number;
  };
  if (!data || !data.__awwditDrag) return;
  if (!panelContainer) return;
  if (typeof data.screenX !== "number") return;

  const panelRect = panelContainer.getBoundingClientRect();
  const width = panelRect.width;
  const minMargin = 12;
  const maxLeft = Math.max(minMargin, window.innerWidth - width - minMargin);

  if (data.phase === "start" || !dragState) {
    dragState = {
      pointerStartScreenX: data.screenX,
      panelStartLeft: panelRect.left,
      anchorTop: panelRect.top
    };
    panelContainer.style.left = `${panelRect.left}px`;
    panelContainer.style.top = `${panelRect.top}px`;
    panelContainer.style.right = "auto";
    panelContainer.style.bottom = "auto";
    panelContainer.style.position = "fixed";
    if (data.phase === "start") {
      return;
    }
  }

  if (!dragState) return;

  const deltaX = data.screenX - dragState.pointerStartScreenX;
  const nextLeft = clamp(dragState.panelStartLeft + deltaX, minMargin, maxLeft);
  panelContainer.style.left = `${nextLeft}px`;
  panelContainer.style.top = `${dragState.anchorTop}px`;

  if (data.phase === "end") {
    dragState = null;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function syncInspectState() {
  if (desiredInspectEnabled && panelVisible) {
    enableInspect();
  } else {
    disableInspect();
  }
}

window.addEventListener("message", handleDragMessage, false);

void ensurePanelMounted();

syncInspectState();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    disableInspect();
    return;
  }
  syncInspectState();
});

function enableInspect() {
  if (inspectEnabled) return;
  inspectEnabled = true;
  document.addEventListener("mousemove", handleHover, true);
  document.addEventListener("click", handleClick, true);
}

function disableInspect() {
  if (!inspectEnabled) return;
  inspectEnabled = false;
  document.removeEventListener("mousemove", handleHover, true);
  document.removeEventListener("click", handleClick, true);
  hideHoverArtifacts();
  updateSelectionOverlay(null);
  lastHoverData = null;
  currentElement = null;
}

function hideHoverArtifacts() {
  highlight.style.display = "none";
  spacingOverlay.style.display = "none";
  hoverCard.style.display = "none";
  hideMeasurements();
}

function handleHover(event: MouseEvent) {
  if (!inspectEnabled) return;
  const target = event.target as HTMLElement | null;
  if (!target || target === document.body || target === document.documentElement) return;
  if (isInsidePanel(target)) return;
  const hoverRect = drawHighlight(target);
  if (currentElement && target !== currentElement) {
    updateMeasurementGuides(currentElement, hoverRect);
  } else {
    hideMeasurements();
  }
  lastHoverData = { element: target, x: event.clientX, y: event.clientY };
  updateHoverCard(target, event.clientX, event.clientY);
}

function handleClick(event: MouseEvent) {
  if (!inspectEnabled) return;
  event.preventDefault();
  event.stopPropagation();
  const target = event.target as HTMLElement | null;
  if (!target || isInsidePanel(target)) return;
  selectElement(target);
}

function drawHighlight(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  highlight.style.display = "block";
  highlight.style.top = `${rect.top}px`;
  highlight.style.left = `${rect.left}px`;
  highlight.style.width = `${rect.width}px`;
  highlight.style.height = `${rect.height}px`;
  positionSpacingOverlay(element, rect);
  return rect;
}

function selectElement(element: HTMLElement) {
  currentElement = element;
  updateSelectionOverlay(element);
  hideMeasurements();
  hoverCard.style.display = "none";
  chrome.runtime.sendMessage({
    type: "ELEMENT_SELECTED",
    payload: serializeElement(element)
  });
}

function serializeElement(element: HTMLElement): SelectedElementPayload {
  const styles = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const typography: ElementStyles = {
    fontFamily: styles.fontFamily || "",
    fontWeight: styles.fontWeight || "",
    fontSize: styles.fontSize || "",
    lineHeight: styles.lineHeight || "",
    letterSpacing: styles.letterSpacing || "",
    textAlign: styles.textAlign || "left",
    textTransform: styles.textTransform || "none",
    color: styles.color || "#111111",
    backgroundColor: styles.backgroundColor || "transparent",
    margin: `${styles.marginTop} ${styles.marginRight} ${styles.marginBottom} ${styles.marginLeft}`,
    padding: `${styles.paddingTop} ${styles.paddingRight} ${styles.paddingBottom} ${styles.paddingLeft}`,
    marginTop: styles.marginTop,
    marginRight: styles.marginRight,
    marginBottom: styles.marginBottom,
    marginLeft: styles.marginLeft,
    paddingTop: styles.paddingTop,
    paddingRight: styles.paddingRight,
    paddingBottom: styles.paddingBottom,
    paddingLeft: styles.paddingLeft
  };

  return {
    tag: element.tagName.toLowerCase(),
    selector: buildSelector(element),
    preciseSelector: buildPreciseSelector(element),
    shortSelector: getShortSelector(element),
    ancestors: collectAncestors(element),
    summary: element.textContent?.trim().slice(0, 120) ?? "",
    textContent: element.textContent ?? "",
    styles: typography,
    metrics: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      margin: typography.margin ?? "0",
      padding: typography.padding ?? "0"
    },
    computed: collectComputedCategories(styles)
  };
}

function getShortSelector(element: HTMLElement) {
  const tag = element.tagName.toLowerCase();
  const firstClass = Array.from(element.classList).find(Boolean);
  return firstClass ? `${tag}.${firstClass}` : tag;
}

function buildSelector(element: HTMLElement) {
  const parts: string[] = [];
  let node: HTMLElement | null = element;
  while (node && parts.length < 4) {
    let selector = node.tagName.toLowerCase();
    if (node.id) {
      selector += `#${node.id}`;
      parts.unshift(selector);
      break;
    }
    if (node.classList.length) {
      selector += `.${Array.from(node.classList).slice(0, 2).join('.')}`;
    }
    parts.unshift(selector);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

function buildPreciseSelector(element: HTMLElement) {
  const parts: string[] = [];
  let node: HTMLElement | null = element;
  while (node && node.nodeType === Node.ELEMENT_NODE && node !== document.documentElement) {
    let selector = node.tagName.toLowerCase();
    if (node.id) {
      selector += `#${node.id}`;
      parts.unshift(selector);
      break;
    }
    if (node.classList.length) {
      selector += `.${Array.from(node.classList).join('.')}`;
    }
    const index = nthOfType(node);
    if (index > 1) {
      selector += `:nth-of-type(${index})`;
    }
    parts.unshift(selector);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

function nthOfType(element: HTMLElement): number {
  let i = 1;
  let sibling = element.previousElementSibling as HTMLElement | null;
  while (sibling) {
    if (sibling.tagName === element.tagName) {
      i += 1;
    }
    sibling = sibling.previousElementSibling as HTMLElement | null;
  }
  return i;
}

function collectAncestors(element: HTMLElement) {
  const ancestors: string[] = [];
  let node = element.parentElement;
  while (node && ancestors.length < 5) {
    const descriptor = [node.tagName.toLowerCase(), node.className?.split(" ").filter(Boolean).slice(0, 2).join(".")]
      .filter(Boolean)
      .join(".");
    ancestors.push(descriptor || node.tagName.toLowerCase());
    node = node.parentElement;
  }
  return ancestors;
}

const COMPUTED_GROUPS: Record<string, string[]> = {
  Layout: ["display", "position", "gap", "flex-direction", "justify-content", "align-items"],
  Spacing: ["margin-top", "margin-bottom", "padding-top", "padding-bottom", "padding-left", "padding-right"],
  Typography: ["font-size", "font-weight", "line-height", "letter-spacing", "text-transform", "text-align"],
  Color: ["color", "background-color", "border-color"],
  Effects: ["box-shadow", "filter", "opacity"]
};

function collectComputedCategories(styles: CSSStyleDeclaration) {
  const categories = Object.entries(COMPUTED_GROUPS)
    .map(([name, properties]) => {
      const props = properties
        .map((property) => ({ property, value: styles.getPropertyValue(property) }))
        .filter((entry) => entry.value && entry.value.trim().length > 0);
      return props.length ? { name, properties: props } : null;
    })
    .filter((category): category is { name: string; properties: { property: string; value: string }[] } => Boolean(category));
  return categories;
}

function positionSpacingOverlay(element: HTMLElement, rect: DOMRect) {
  if (!inspectEnabled) return;
  const styles = window.getComputedStyle(element);
  const marginTop = parseFloat(styles.marginTop) || 0;
  const marginBottom = parseFloat(styles.marginBottom) || 0;
  const marginLeft = parseFloat(styles.marginLeft) || 0;
  const marginRight = parseFloat(styles.marginRight) || 0;
  const paddingTop = parseFloat(styles.paddingTop) || 0;
  const paddingBottom = parseFloat(styles.paddingBottom) || 0;
  const paddingLeft = parseFloat(styles.paddingLeft) || 0;
  const paddingRight = parseFloat(styles.paddingRight) || 0;

  spacingOverlay.style.display = "block";
  spacingOverlay.style.top = `${rect.top - marginTop}px`;
  spacingOverlay.style.left = `${rect.left - marginLeft}px`;
  spacingOverlay.style.width = `${rect.width + marginLeft + marginRight}px`;
  spacingOverlay.style.height = `${rect.height + marginTop + marginBottom}px`;

  Object.assign(paddingOverlay.style, {
    top: `${marginTop}px`,
    left: `${marginLeft}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });

  Object.assign(contentOverlay.style, {
    top: `${paddingTop}px`,
    left: `${paddingLeft}px`,
    width: `${rect.width - paddingLeft - paddingRight}px`,
    height: `${rect.height - paddingTop - paddingBottom}px`
  });
}

function applyStylePatch(patch: Partial<ElementStyles>) {
  if (!currentElement) return;
  Object.entries(patch).forEach(([key, value]) => {
    if (!value) return;
    // @ts-expect-error: dynamic assignment is safe here
    currentElement!.style[key] = value;
  });
  chrome.runtime.sendMessage({
    type: "ELEMENT_SELECTED",
    payload: serializeElement(currentElement)
  });
}

function collectPageInsights(): PageInsightsPayload {
  const title = document.title || location.hostname;
  const description = document.querySelector<HTMLMetaElement>("meta[name='description']")?.content;
  const previewImage = resolvePreviewImage(
    document.querySelector<HTMLMetaElement>("meta[property='og:image']")?.content ||
      document.querySelector<HTMLMetaElement>("meta[name='twitter:image']")?.content ||
      document.querySelector<HTMLMetaElement>("meta[property='twitter:image']")?.content
  );
  const totalNodes = document.querySelectorAll("*").length;
  const bodyStyles = window.getComputedStyle(document.body);

  const colors = collectColorPalette();

  const headingNode = document.querySelector("h1, h2, h3");
  const headingStyles = window.getComputedStyle(headingNode ?? document.body);
  const headingFont = headingStyles.fontFamily || bodyStyles.fontFamily || "system";
  const bodyFont = bodyStyles.fontFamily || "system";

  const images = Array.from(document.images)
    .slice(0, 4)
    .map((img) => {
      const type: "vector" | "bitmap" = img.src.endsWith(".svg") ? "vector" : "bitmap";
      return {
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
        type
      };
    });

  return {
    overview: {
      title,
      url: location.href,
      description,
      primaryFont: bodyStyles.fontFamily,
      totalNodes,
      previewImage
    },
    colors,
    typography: {
      headings: formatFontFamily(headingFont),
      body: formatFontFamily(bodyFont)
    },
    images
  };
}

function collectColorPalette(): PageInsightsPayload["colors"] {
  const colorCounts = new Map<string, number>();
  const elements = Array.from(document.querySelectorAll<HTMLElement>("*"));

  elements.forEach((element) => {
    const styles = window.getComputedStyle(element);
    const candidates = [
      styles.color,
      styles.backgroundColor,
      styles.borderTopColor,
      styles.borderRightColor,
      styles.borderBottomColor,
      styles.borderLeftColor
    ];

    candidates.forEach((raw) => {
      const normalized = normalizeColor(raw);
      if (!normalized) return;
      colorCounts.set(normalized, (colorCounts.get(normalized) ?? 0) + 1);
    });
  });

  const total = Array.from(colorCounts.values()).reduce((sum, count) => sum + count, 0);
  if (total === 0) {
    return [];
  }

  return Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({
      value,
      usage: Math.max(1, Math.round((count / total) * 100))
    }));
}

function normalizeColor(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "transparent" || trimmed === "inherit" || trimmed === "initial") {
    return undefined;
  }

  if (trimmed.startsWith("rgba")) {
    const alpha = parseFloat(trimmed.slice(trimmed.lastIndexOf(",") + 1, trimmed.length - 1));
    if (!Number.isNaN(alpha) && alpha === 0) {
      return undefined;
    }
  }

  return trimmed.toLowerCase().replace(/\s*,\s*/g, ",");
}

function handlePanelMessage(message: PanelToContentMessage) {
  switch (message.type) {
    case "TOGGLE_INSPECT_MODE":
      showHoverCard = message.payload.showHoverCard;
      desiredInspectEnabled = message.payload.enabled;
      syncInspectState();
      if (!showHoverCard) {
        hoverCard.style.display = "none";
      } else if (inspectEnabled && lastHoverData) {
        updateHoverCard(lastHoverData.element, lastHoverData.x, lastHoverData.y);
      }
      break;
    case "APPLY_STYLE_PATCH":
      applyStylePatch(message.payload.styles);
      break;
    case "RESET_INLINE_STYLES":
      if (currentElement) {
        currentElement.removeAttribute("style");
        chrome.runtime.sendMessage({
          type: "ELEMENT_SELECTED",
          payload: serializeElement(currentElement)
        });
      }
      break;
    case "REQUEST_PAGE_INSIGHTS":
      chrome.runtime.sendMessage({
        type: "PAGE_INSIGHTS",
        payload: collectPageInsights()
      });
      break;
    case "CLOSE_PANEL":
      hidePanel();
      break;
    case "TOGGLE_PANEL_VISIBILITY":
      if (panelVisible) {
        hidePanel();
      } else {
        void showPanel();
      }
      break;
  }
}

chrome.runtime.onMessage.addListener((message: PanelToContentMessage) => {
  handlePanelMessage(message);
});

chrome.runtime.sendMessage({
  type: "PAGE_INSIGHTS",
  payload: collectPageInsights()
});

function resolvePreviewImage(src?: string | null) {
  if (!src) return undefined;
  try {
    return new URL(src, document.baseURI).toString();
  } catch {
    return src;
  }
}

function updateHoverCard(element: HTMLElement, x: number, y: number) {
  if (!showHoverCard || !inspectEnabled) {
    hoverCard.style.display = "none";
    return;
  }

  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const shortLabel = getShortSelector(element);
  const colorHex = normalizeToHex(styles.color);
  hoverCard.innerHTML = `
    <div style="font-size:13px; font-weight:700; letter-spacing:0.01em; color:#4338ca;">
      ${shortLabel}
    </div>
    <div style="margin-top:6px; font-size:13px; font-weight:600;">${Math.round(rect.width)} × ${Math.round(rect.height)} px</div>
    <div style="margin-top:4px; color:#475569;">Font: ${styles.fontFamily?.split(",")[0] ?? "system"} · ${styles.fontSize}</div>
    <div style="margin-top:4px; color:#475569; display:flex; align-items:center; gap:8px;">
      <span>Color: ${colorHex}</span>
      <span style="width:14px; height:14px; border-radius:4px; background:${colorHex}; border:1px solid rgba(15,23,42,0.15);"></span>
    </div>`;

  hoverCard.style.display = "block";
  const offset = 18;
  const maxLeft = window.innerWidth - hoverCard.offsetWidth - 16;
  const maxTop = window.innerHeight - hoverCard.offsetHeight - 16;
  const desiredLeft = x + offset;
  const desiredTop = y + offset;
  hoverCard.style.left = `${Math.min(desiredLeft, maxLeft)}px`;
  hoverCard.style.top = `${Math.min(desiredTop, maxTop)}px`;
}

function isInsidePanel(node: EventTarget | null) {
  if (!node || !(node instanceof Node)) return false;
  return panelContainer?.contains(node) ?? false;
}

async function ensurePanelMounted() {
  if (panelContainer && panelIframe) return;
  const existing = document.getElementById(PANEL_CONTAINER_ID) as HTMLDivElement | null;
  const runtimeId = chrome.runtime?.id ?? "";
  if (existing) {
    if (existing.dataset.runtimeId !== runtimeId) {
      existing.remove();
    } else {
      panelContainer = existing;
      panelIframe = existing.querySelector("iframe");
      return;
    }
  }

  const container = document.createElement("div");
  container.id = PANEL_CONTAINER_ID;
  container.dataset.runtimeId = runtimeId;
  Object.assign(container.style, {
    position: "fixed",
    top: "16px",
    right: "16px",
    width: "360px",
    height: "calc(100vh - 32px)",
    zIndex: "2147483644",
    borderRadius: "28px",
    overflow: "hidden",
    display: "none",
    boxShadow: "0 25px 60px rgba(15,23,42,0.35)",
    pointerEvents: "auto"
  });

  const iframe = document.createElement("iframe");
  iframe.id = PANEL_IFRAME_ID;
  iframe.allow = "clipboard-write";
  iframe.style.border = "none";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.background = "transparent";

  const tabId = await getTabId();
  const query = tabId ? `?tabId=${tabId}` : "";
  iframe.src = chrome.runtime.getURL(`index.html${query}`);

  container.appendChild(iframe);
  document.documentElement.appendChild(container);

  panelContainer = container;
  panelIframe = iframe;
}

async function showPanel() {
  await ensurePanelMounted();
  if (!panelContainer) return;
  panelContainer.style.display = "block";
  panelVisible = true;
  syncInspectState();
}

function hidePanel() {
  if (!panelContainer) return;
  panelContainer.style.display = "none";
  panelVisible = false;
  syncInspectState();
  hideHoverArtifacts();
}

function getTabId(): Promise<number | undefined> {
  if (typeof tabIdCache === "number") {
    return Promise.resolve(tabIdCache);
  }
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_TAB_ID" }, (response) => {
      if (response?.tabId) {
        tabIdCache = response.tabId;
      }
      resolve(tabIdCache);
    });
  });
}

function formatFontFamily(font: string) {
  return font.split(",").map((token) => token.trim()).find(Boolean) ?? font;
}

function normalizeToHex(raw?: string | null) {
  if (!raw) return "#000000";
  const value = raw.trim();
  const lower = value.toLowerCase();
  if (lower.startsWith("#")) {
    if (value.length === 4) {
      const [, r, g, b] = value;
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    return value.toUpperCase();
  }
  if (lower.startsWith("lab(")) {
    const labHex = labToHex(value);
    if (labHex) return labHex;
  }
  const ctx = colorContext;
  if (!ctx) return value;
  try {
    ctx.fillStyle = "#000000";
    ctx.fillStyle = value;
    const parsed = ctx.fillStyle;
    if (parsed.startsWith("#")) {
      return parsed.toUpperCase();
    }
    const rgbMatch = parsed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      return `#${Number(r).toString(16).padStart(2, "0")}${Number(g).toString(16).padStart(2, "0")}${Number(b).toString(16).padStart(2, "0")}`.toUpperCase();
    }
  } catch {
    // fall through
  }
  return value;
}

function labToHex(labValue: string) {
  const labRegex = /^lab\(\s*([-\d.]+)(%?)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([-\d.]+)(%?))?\s*\)$/i;
  const match = labValue.trim().match(labRegex);
  if (!match) return undefined;
  let [, lRaw, lUnit, aRaw, bRaw] = match;
  let L = parseFloat(lRaw);
  const a = parseFloat(aRaw);
  const b = parseFloat(bRaw);
  if (Number.isNaN(L) || Number.isNaN(a) || Number.isNaN(b)) {
    return undefined;
  }
  if (lUnit === "%") {
    L = (L / 100) * 100;
  }
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const fx3 = fx ** 3;
  const fz3 = fz ** 3;
  const xr = fx3 > epsilon ? fx3 : (116 * fx - 16) / kappa;
  const yr = L > kappa * epsilon ? fy ** 3 : L / kappa;
  const zr = fz3 > epsilon ? fz3 : (116 * fz - 16) / kappa;
  const Xn = 0.95047;
  const Yn = 1;
  const Zn = 1.08883;
  const X = xr * Xn;
  const Y = yr * Yn;
  const Z = zr * Zn;
  let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
  let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
  let bl = X * 0.0557 + Y * -0.204 + Z * 1.057;
  const linearToSrgb = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };
  r = linearToSrgb(r);
  g = linearToSrgb(g);
  bl = linearToSrgb(bl);
  const toHex = (c: number) => Math.round(c * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}
