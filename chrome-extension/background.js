// Background service worker - Central coordinator for action recording
let recordingSession = {
  isRecording: false,
  actions: [],
  domain: '',
  startTime: 0
};

chrome.runtime.onInstalled.addListener(() => {
  console.log('ScrapAI Auto-Login extension installed');
  // Clear any stale recording state
  chrome.storage.local.set({ isRecording: false, recordedActions: [] });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message.type);
  
  if (message.type === 'START_RECORDING') {
    recordingSession = {
      isRecording: true,
      actions: [],
      domain: message.domain || '',
      startTime: Date.now()
    };
    chrome.storage.local.set({ 
      isRecording: true, 
      recordedActions: [],
      recordingDomain: recordingSession.domain
    });
    sendResponse({ success: true, startTime: recordingSession.startTime });
    return true;
  }
  
  if (message.type === 'ADD_ACTION') {
    if (recordingSession.isRecording) {
      // Check if it's an input update (same selector)
      if (message.action.type === 'input') {
        const existingIndex = recordingSession.actions.findIndex(
          a => a.type === 'input' && a.selector === message.action.selector
        );
        if (existingIndex >= 0) {
          recordingSession.actions[existingIndex] = message.action;
        } else {
          recordingSession.actions.push(message.action);
        }
      } else {
        recordingSession.actions.push(message.action);
      }
      
      // Persist to storage
      chrome.storage.local.set({ recordedActions: recordingSession.actions });
      console.log('[Background] Actions:', recordingSession.actions.length);
      sendResponse({ success: true, count: recordingSession.actions.length });
    } else {
      sendResponse({ success: false, error: 'Not recording' });
    }
    return true;
  }
  
  if (message.type === 'GET_RECORDING_STATE') {
    sendResponse({
      isRecording: recordingSession.isRecording,
      actions: recordingSession.actions,
      count: recordingSession.actions.length,
      startTime: recordingSession.startTime
    });
    return true;
  }
  
  if (message.type === 'STOP_RECORDING') {
    const actions = [...recordingSession.actions];
    recordingSession = {
      isRecording: false,
      actions: [],
      domain: '',
      startTime: 0
    };
    chrome.storage.local.set({ 
      isRecording: false, 
      recordedActions: [],
      recordingDomain: ''
    });
    sendResponse({ success: true, actions });
    return true;
  }
  
  if (message.type === 'SAVE_SITE') {
    const actions = [...recordingSession.actions];
    const site = {
      url: message.url,
      actions: actions,
      recordedAt: new Date().toISOString()
    };
    
    // Extract credentials for display
    const inputs = actions.filter(a => a.type === 'input');
    const passwordInput = inputs.find(a => a.inputType === 'password');
    const usernameInput = inputs.find(a => a.inputType !== 'password');
    if (usernameInput) site.username = usernameInput.value;
    if (passwordInput) site.password = passwordInput.value;
    
    chrome.storage.local.get(['sites'], (result) => {
      const sites = result.sites || [];
      const domain = new URL(site.url).hostname;
      const existingIndex = sites.findIndex(s => {
        try { return new URL(s.url).hostname === domain; } catch { return false; }
      });
      
      if (existingIndex >= 0) {
        sites[existingIndex] = site;
      } else {
        sites.push(site);
      }
      
      chrome.storage.local.set({ 
        sites,
        isRecording: false,
        recordedActions: [],
        recordingDomain: ''
      }, () => {
        recordingSession = {
          isRecording: false,
          actions: [],
          domain: '',
          startTime: 0
        };
        sendResponse({ success: true, count: actions.length });
      });
    });
    return true;
  }
  
  if (message.type === 'LOGIN_SUCCESS') {
    console.log('Login successful on:', message.domain);
  }
  
  return true;
});
