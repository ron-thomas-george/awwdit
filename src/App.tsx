import { useCallback, useEffect, useRef, useState } from "react";
import { PanelShell } from "./components/panel-shell";
import { SidePanelTabs } from "./components/side-panel-tabs";
import { SelectedElementPayload, PageInsightsPayload, PanelToContentMessage } from "./lib/messages";
import { InspectorHeader } from "./components/inspector-header";
import { requestTabScreenshot, sendMessageToActiveTab, setActiveTabId } from "./lib/chrome";
import { SelectedElementView } from "./components/selected-element-view";

function App() {
  const [showHoverCard, setShowHoverCard] = useState(true);
  const [selectedElement, setSelectedElement] = useState<SelectedElementPayload | null>(null);
  const [pageInsights, setPageInsights] = useState<PageInsightsPayload | null>(null);
  const [panelView, setPanelView] = useState<"overview" | "element">("overview");
  const screenshotRequestedRef = useRef(false);

  const notifyPanelReady = useCallback(() => {
    if (!chrome?.runtime) return;
    chrome.runtime.sendMessage({ type: "PANEL_READY" }, () => {
      if (chrome.runtime.lastError) {
        console.warn("Panel ready handshake failed", chrome.runtime.lastError.message);
      }
    });
  }, []);

  useEffect(() => {
    notifyPanelReady();
  }, [notifyPanelReady]);

  useEffect(() => {
    if (!chrome?.runtime) return;
    let stopped = false;
    let port: chrome.runtime.Port | null = null;

    const connectPort = () => {
      if (stopped) return;
      try {
        port = chrome.runtime.connect({ name: "panel-bridge" });
        notifyPanelReady();
        port.onDisconnect.addListener(() => {
          port = null;
          if (!stopped) {
            setTimeout(connectPort, 250);
          }
        });
      } catch (error) {
        console.warn("Failed to connect to background", error);
        if (!stopped) {
          setTimeout(connectPort, 500);
        }
      }
    };

    connectPort();

    return () => {
      stopped = true;
      port?.disconnect();
    };
  }, [notifyPanelReady]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabIdParam = params.get("tabId");
    if (!tabIdParam) return;
    const parsed = Number(tabIdParam);
    if (!Number.isNaN(parsed)) {
      setActiveTabId(parsed);
    }
  }, []);

  const requestPageInsights = useCallback(() => {
    if (!chrome?.runtime) return;
    screenshotRequestedRef.current = false;
    const requestMessage: PanelToContentMessage = { type: "REQUEST_PAGE_INSIGHTS" };
    void sendMessageToActiveTab(requestMessage);
  }, []);

  useEffect(() => {
    if (!chrome?.runtime) return;

    const handleMessage = (message: { type: string; payload?: unknown }) => {
      if (message.type === "ELEMENT_SELECTED") {
        setSelectedElement(message.payload as SelectedElementPayload);
        setPanelView("element");
      }
      if (message.type === "PAGE_INSIGHTS") {
        screenshotRequestedRef.current = false;
        setPageInsights(message.payload as PageInsightsPayload);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    requestPageInsights();

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [requestPageInsights]);

  useEffect(() => {
    if (!chrome?.tabs) return;

    const handleTabActivated = () => {
      setPageInsights(null);
      setSelectedElement(null);
      setPanelView("overview");
      requestPageInsights();
    };

    const handleTabUpdated = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (!tab.active) return;
      if (changeInfo.status !== "complete" && !changeInfo.url) return;
      setPageInsights(null);
      setSelectedElement(null);
      setPanelView("overview");
      requestPageInsights();
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
    };
  }, [requestPageInsights]);

  useEffect(() => {
    if (!chrome?.runtime) return;

    const toggleMessage: PanelToContentMessage = {
      type: "TOGGLE_INSPECT_MODE",
      payload: { enabled: true, showHoverCard }
    };
    void sendMessageToActiveTab(toggleMessage);
  }, [showHoverCard]);

  useEffect(() => {
    if (!chrome?.runtime) return;
    if (!pageInsights) return;
    if (pageInsights.overview.previewImage) return;
    if (screenshotRequestedRef.current) return;

    screenshotRequestedRef.current = true;
    let cancelled = false;
    void requestTabScreenshot().then(({ previewImage }) => {
      if (cancelled || !previewImage) return;
      setPageInsights((prev) => (prev ? { ...prev, overview: { ...prev.overview, previewImage } } : prev));
    });

    return () => {
      cancelled = true;
    };
  }, [pageInsights]);

  const handleElementStyleChange = (styles: Partial<SelectedElementPayload["styles"]>) => {
    setSelectedElement((prev) => {
      if (!prev) return prev;
      const nextStyles = { ...prev.styles, ...styles };
      const nextMetrics = { ...prev.metrics };
      if (styles.margin) nextMetrics.margin = styles.margin;
      if (styles.padding) nextMetrics.padding = styles.padding;
      return { ...prev, styles: nextStyles, metrics: nextMetrics };
    });
    const patchMessage: PanelToContentMessage = {
      type: "APPLY_STYLE_PATCH",
      payload: { styles }
    };
    void sendMessageToActiveTab(patchMessage);
  };

  const handleClosePanel = () => {
    const closeMessage: PanelToContentMessage = { type: "CLOSE_PANEL" };
    void sendMessageToActiveTab(closeMessage);
  };

  return (
    <div className="h-full w-full">
      <PanelShell onClose={handleClosePanel}>
        {panelView === "element" && selectedElement ? (
          <SelectedElementView
            selectedElement={selectedElement}
            showHoverCard={showHoverCard}
            onToggleHoverCard={(next) => setShowHoverCard(next)}
            onBack={() => setPanelView("overview")}
            onChange={handleElementStyleChange}
          />
        ) : (
          <div className="flex h-full flex-col gap-4 overflow-hidden">
            <InspectorHeader showHoverCard={showHoverCard} onToggleHoverCard={(next: boolean) => setShowHoverCard(next)} />
            <div className="flex-1 overflow-hidden">
              <SidePanelTabs pageInsights={pageInsights} selectedElement={selectedElement} />
            </div>
          </div>
        )}
      </PanelShell>
    </div>
  );
}

export default App;
