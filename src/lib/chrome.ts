import { PanelToContentMessage } from "./messages";

let cachedTabId: number | undefined;

function setTabCache(tabId?: number) {
  if (typeof tabId === "number") {
    cachedTabId = tabId;
  }
}

async function getActiveTabId(): Promise<number | undefined> {
  if (typeof cachedTabId === "number") {
    return cachedTabId;
  }
  if (!chrome?.tabs) return undefined;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (typeof tab?.id === "number") {
    cachedTabId = tab.id;
    return tab.id;
  }
  return undefined;
}

export function setActiveTabId(tabId?: number) {
  setTabCache(tabId);
}

export async function sendMessageToActiveTab(message: PanelToContentMessage) {
  try {
    if (!chrome?.tabs) return;
    const tabId = await getActiveTabId();
    if (typeof tabId === "number") {
      await chrome.tabs.sendMessage(tabId, message);
    }
  } catch (error) {
    console.warn("Failed to send message to tab", error);
  }
}

export async function requestTabScreenshot() {
  return new Promise<{ previewImage?: string }>((resolve) => {
    chrome.runtime.sendMessage({ type: "REQUEST_TAB_SCREENSHOT" }, (response) => {
      resolve(response ?? {});
    });
  });
}
