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

const PANEL_CONTAINER_ID = "awwdit-panel-container";
const PANEL_IFRAME_ID = "awwdit-panel-frame";

const highlight = document.createElement("div");
Object.assign(highlight.style, {
  position: "fixed",
  pointerEvents: "none",
  zIndex: "2147483642",
  border: "2px solid #7C3AED",
  borderRadius: "0px",
  transition: "all 80ms ease",
  display: "none"
});

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
  background: "rgba(59,130,246,0.08)",
  borderRadius: "10px"
});

const paddingOverlay = document.createElement("div");
Object.assign(paddingOverlay.style, {
  position: "absolute",
  background: "rgba(16,185,129,0.18)",
  borderRadius: "8px"
});

const contentOverlay = document.createElement("div");
Object.assign(contentOverlay.style, {
  position: "absolute",
  background: "rgba(255,255,255,0.8)",
  borderRadius: "6px",
  border: "1px dashed rgba(15,23,42,0.2)"
});

paddingOverlay.appendChild(contentOverlay);
spacingOverlay.appendChild(paddingOverlay);

document.documentElement.appendChild(highlight);
document.documentElement.appendChild(hoverCard);
document.documentElement.appendChild(spacingOverlay);

void ensurePanelMounted();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    disableInspect();
    return;
  }
  syncInspectState();
});

function syncInspectState() {
  if (desiredInspectEnabled && panelVisible) {
    enableInspect();
  } else {
    disableInspect();
  }
}

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
  lastHoverData = null;
}

function hideHoverArtifacts() {
  highlight.style.display = "none";
  spacingOverlay.style.display = "none";
  hoverCard.style.display = "none";
}

function handleHover(event: MouseEvent) {
  if (!inspectEnabled) return;
  const target = event.target as HTMLElement | null;
  if (!target || target === document.body || target === document.documentElement) return;
  if (isInsidePanel(target)) return;
  drawHighlight(target);
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
}

function selectElement(element: HTMLElement) {
  currentElement = element;
  drawHighlight(element);
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
    padding: `${styles.paddingTop} ${styles.paddingRight} ${styles.paddingBottom} ${styles.paddingLeft}`
  };

  return {
    tag: element.tagName.toLowerCase(),
    selector: buildSelector(element),
    preciseSelector: buildPreciseSelector(element),
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
  const classes = Array.from(element.classList).slice(0, 3).join(".");
  hoverCard.innerHTML = `
    <div style="font-size:11px; text-transform:uppercase; font-weight:600; letter-spacing:0.08em; color:#6366f1;">
      ${element.tagName.toLowerCase()}
      ${classes ? `<span style="color:#94a3b8; text-transform:none;">.${classes}</span>` : ""}
    </div>
    <div style="margin-top:6px; font-size:13px; font-weight:600;">${Math.round(rect.width)} × ${Math.round(rect.height)} px</div>
    <div style="margin-top:4px; color:#475569;">Font: ${styles.fontFamily?.split(",")[0] ?? "system"} · ${styles.fontSize}</div>
    <div style="margin-top:4px; color:#475569; display:flex; align-items:center; gap:8px;">
      <span>Color: ${styles.color}</span>
      <span style="width:14px; height:14px; border-radius:4px; background:${styles.color}; border:1px solid rgba(15,23,42,0.15);"></span>
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
