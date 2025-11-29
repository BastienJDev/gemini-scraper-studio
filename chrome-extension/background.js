// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('ScrapAI Auto-Login extension installed');
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOGIN_SUCCESS') {
    console.log('Login successful on:', message.domain);
  }
  return true;
});
