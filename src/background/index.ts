// Background service worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('JobFit AI Extension installed');
});

// Open Side Panel on action click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: unknown) => console.error(error));

// Listener for messages from Side Panel or Content Scripts
// CRITICAL: We only return true if we are actually handling an async message.
// This prevents the background script from hanging the communication channel for 
// other listeners (like the Offscreen PDF Parser).
chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.type === 'PING') {
    sendResponse({ type: 'PONG' });
    return true; // We are handling this asynchronously
  }

  // Log and ignore everything else so other listeners (Offscreen) can take it
  console.log('Background: Forwarding/Ignoring message type:', message.type);
  return false; 
});
