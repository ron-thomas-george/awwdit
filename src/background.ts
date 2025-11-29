import type { RuntimeMessage } from "./lib/messages";

let panelReady = false;
const pendingMessages: RuntimeMessage[] = [];

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  await togglePanel(tab.id);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PING_BACKGROUND") {
    sendResponse({ ok: true });
  }

  if (message.type === "GET_TAB_ID") {
    sendResponse({ tabId: sender.tab?.id });
    return true;
  }

  if (message.type === "REQUEST_TAB_SCREENSHOT") {
    captureVisibleTab()
      .then((previewImage) => sendResponse({ previewImage }))
      .catch((error) => sendResponse({ error: (error as Error).message }));
    return true;
  }

  if (message.type === "PANEL_READY") {
    panelReady = true;
    flushPending();
    sendResponse({ ok: true });
    return true;
  }

  if (shouldForward(message)) {
    forwardToPanel(message);
  }
});

async function captureVisibleTab(): Promise<string | undefined> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.windowId) return undefined;
    return await chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 60 });
  } catch (error) {
    console.warn("Failed to capture tab", error);
    return undefined;
  }
}

async function togglePanel(tabId: number) {
  return new Promise<void>((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "TOGGLE_PANEL_VISIBILITY" }, async () => {
      if (chrome.runtime.lastError) {
        try {
          await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
          chrome.tabs.sendMessage(tabId, { type: "TOGGLE_PANEL_VISIBILITY" }, () => {
            if (chrome.runtime.lastError) {
              console.warn("Toggle panel failed", chrome.runtime.lastError.message);
            }
            resolve();
          });
          return;
        } catch (error) {
          console.warn("Failed to inject content script", error);
        }
      }
      resolve();
    });
  });
}

function shouldForward(message: { type?: string; __forwarded?: boolean }) {
  if (!message || message.__forwarded) return false;
  return message.type === "ELEMENT_SELECTED" || message.type === "PAGE_INSIGHTS";
}

function forwardToPanel(message: RuntimeMessage) {
  if (!panelReady) {
    pendingMessages.push(message);
    return;
  }
  chrome.runtime.sendMessage({ ...message, __forwarded: true }).catch((error) => {
    console.warn("Forward message failed", error);
  });
}

function flushPending() {
  if (!panelReady || pendingMessages.length === 0) return;
  const queue = pendingMessages.splice(0, pendingMessages.length);
  queue.forEach((msg) => forwardToPanel(msg));
}
