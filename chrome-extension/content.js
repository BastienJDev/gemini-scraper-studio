// Content script - Handles action recording and automated login replay

(async function() {
  console.log('[ScrapAI Content] Script loaded on:', window.location.href);
  
  // Check for pending login task (predefined sites like Dalloz)
  const storage = await chrome.storage.local.get(['pendingLogin', 'pendingReplay', 'isRecording']);
  console.log('[ScrapAI Content] Storage state:', storage);
  
  if (storage.pendingLogin) {
    console.log('[ScrapAI Content] Found pending login, executing...');
    await executePredefinedLogin(storage.pendingLogin);
  } else if (storage.pendingReplay) {
    console.log('[ScrapAI Content] Found pending replay, executing...');
    await executeReplayActions(storage.pendingReplay);
  } else if (storage.isRecording) {
    console.log('[ScrapAI Content] Recording mode active');
    setupActionRecorder();
  } else {
    console.log('[ScrapAI Content] No pending task, checking for auto-fill...');
    await autoFillIfSaved();
  }
})();

// Execute predefined login sequence (Dalloz, etc.)
async function executePredefinedLogin(loginTask) {
  const { config, siteId } = loginTask;
  const { actions, credentials } = config;
  const currentStep = loginTask.currentStep || 0;
  
  console.log(`[ScrapAI] Starting login for ${siteId} at step ${currentStep}/${actions.length}`);
  showNotification(`Connexion à ${config.name} en cours... (${currentStep}/${actions.length})`, false);
  
  // Wait for page to be fully loaded
  await waitForPageLoad();
  await sleep(1000); // Extra delay for dynamic content
  
  // Execute each action starting from current step
  for (let i = currentStep; i < actions.length; i++) {
    const action = actions[i];
    console.log(`[ScrapAI] Executing action ${i + 1}/${actions.length}:`, action.type, action.selector);
    
    try {
      // Update current step before executing (in case of redirect)
      loginTask.currentStep = i;
      await chrome.storage.local.set({ pendingLogin: loginTask });
      
      await executeAction(action, credentials);
      
      // Wait for specified delay or default
      const delay = action.delay || 500;
      await sleep(delay);
      
      // If this action causes navigation, stop and let the new page continue
      if (action.type === 'click') {
        // Check if page is navigating
        await sleep(500);
        // Update step to next one for when page reloads
        loginTask.currentStep = i + 1;
        await chrome.storage.local.set({ pendingLogin: loginTask });
      }
      
    } catch (error) {
      console.error(`[ScrapAI] Action failed:`, error);
      // Don't show error for element not found - might be on wrong page
      if (!error.message.includes('not found')) {
        showNotification(`Erreur: ${error.message}`, true);
      }
      // Continue to next action - element might not exist on this page
      continue;
    }
  }
  
  // All actions completed - clear the task
  console.log('[ScrapAI] All actions completed, clearing task');
  await chrome.storage.local.remove('pendingLogin');
  showNotification(`Connexion à ${config.name} réussie !`, false);
}

// Execute a single action
async function executeAction(action, credentials) {
  switch (action.type) {
    case 'click':
      await executeClick(action);
      break;
      
    case 'fill':
      await executeFill(action, credentials);
      break;
      
    case 'waitForSelector':
      await waitForElement(action.selector, action.timeout || 10000);
      break;
      
    case 'waitForNavigation':
      await sleep(action.delay || 2000);
      break;
      
    default:
      console.warn(`[ScrapAI] Unknown action type: ${action.type}`);
  }
}

// Execute click action
async function executeClick(action) {
  const element = await findElement(action);
  
  if (!element) {
    throw new Error(`Element not found: ${action.selector || action.roleName}`);
  }
  
  // Scroll into view
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(200);
  
  // Simulate realistic click
  simulateClick(element);
}

// Execute fill action
async function executeFill(action, credentials) {
  const element = await findElement(action);
  
  if (!element) {
    throw new Error(`Input not found: ${action.selector}`);
  }
  
  // Determine the value to fill
  let value = action.value;
  if (action.valueKey && credentials) {
    value = credentials[action.valueKey];
  }
  
  if (!value) {
    throw new Error(`No value for input: ${action.selector}`);
  }
  
  // Focus and fill
  element.focus();
  await sleep(100);
  
  // Clear existing value
  element.value = '';
  element.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Type character by character for realism
  for (const char of value) {
    element.value += char;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(30 + Math.random() * 50);
  }
  
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

// Find element by various selectors
async function findElement(action, timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    let element = null;
    
    // Try CSS selector first
    if (action.selector) {
      const selectors = action.selector.split(', ');
      for (const sel of selectors) {
        try {
          // Handle :has-text() pseudo-selector
          if (sel.includes(':has-text(')) {
            element = findByTextContent(sel);
          } else {
            element = document.querySelector(sel);
          }
          if (element) break;
        } catch (e) {
          // Invalid selector, try next
        }
      }
    }
    
    // Try by role
    if (!element && action.role && action.roleName) {
      element = findByRole(action.role, action.roleName);
    }
    
    if (element && isVisible(element)) {
      return element;
    }
    
    await sleep(200);
  }
  
  return null;
}

// Find element by text content
function findByTextContent(selector) {
  const match = selector.match(/(.+?):has-text\(['"](.+?)['"]\)/);
  if (!match) return null;
  
  const baseSelector = match[1];
  const text = match[2];
  
  const elements = document.querySelectorAll(baseSelector || '*');
  for (const el of elements) {
    if (el.textContent.includes(text)) {
      return el;
    }
  }
  return null;
}

// Find element by ARIA role
function findByRole(role, name) {
  const elements = document.querySelectorAll(`[role="${role}"]`);
  for (const el of elements) {
    const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('name') || el.textContent;
    if (ariaLabel && ariaLabel.includes(name)) {
      return el;
    }
  }
  
  // Also check native elements
  if (role === 'button') {
    const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
    for (const btn of buttons) {
      if (btn.textContent.includes(name) || btn.value?.includes(name)) {
        return btn;
      }
    }
  }
  
  if (role === 'combobox') {
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])');
    for (const input of inputs) {
      const label = input.getAttribute('aria-label') || input.getAttribute('placeholder') || '';
      if (label.includes(name)) {
        return input;
      }
    }
  }
  
  if (role === 'option') {
    const options = document.querySelectorAll('[role="option"], option, li');
    for (const opt of options) {
      if (opt.textContent.includes(name)) {
        return opt;
      }
    }
  }
  
  if (role === 'link') {
    const links = document.querySelectorAll('a');
    for (const link of links) {
      if (link.textContent.includes(name)) {
        return link;
      }
    }
  }
  
  return null;
}

// Check if element is visible
function isVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetParent !== null;
}

// Wait for element to appear
async function waitForElement(selector, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element && isVisible(element)) {
      return element;
    }
    await sleep(200);
  }
  
  throw new Error(`Timeout waiting for: ${selector}`);
}

// Wait for page to be fully loaded
function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      setTimeout(resolve, 500);
    } else {
      window.addEventListener('load', () => setTimeout(resolve, 500));
    }
  });
}

// Simulate realistic click
function simulateClick(element) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  element.focus();
  
  const events = ['mousedown', 'mouseup', 'click'];
  
  for (const eventType of events) {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y
    });
    element.dispatchEvent(event);
  }
  
  // Also try native click for stubborn elements
  if (typeof element.click === 'function') {
    element.click();
  }
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Show notification
function showNotification(message, isError = false) {
  // Remove existing notification
  const existing = document.getElementById('scrapai-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.id = 'scrapai-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${isError ? '#ef4444' : '#0ea5e9'};
    color: white;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 5000);
}

// Execute replay actions (for manually recorded sites)
async function executeReplayActions(replayTask) {
  const { actions } = replayTask;
  
  console.log('[ScrapAI] Replaying recorded actions:', actions.length);
  showNotification('Replay des actions en cours...', false);
  
  // Clear the pending task
  await chrome.storage.local.remove('pendingReplay');
  
  await waitForPageLoad();
  
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    console.log(`[ScrapAI] Replaying action ${i + 1}/${actions.length}:`, action);
    
    try {
      const element = await findRecordedElement(action);
      
      if (!element) {
        console.warn('[ScrapAI] Element not found, skipping:', action);
        continue;
      }
      
      if (action.type === 'click') {
        simulateClick(element);
      } else if (action.type === 'input') {
        element.focus();
        setInputValue(element, action.value || '');
      } else if (action.type === 'enter') {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
      }
      
      await sleep(action.delay || 800);
      
    } catch (error) {
      console.error('[ScrapAI] Replay action failed:', error);
    }
  }
  
  showNotification('Replay terminé !', false);
}

// Set input value - works with React/Vue/Angular
function setInputValue(element, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )?.set;
  
  const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  )?.set;
  
  const setter = element.tagName === 'TEXTAREA' ? nativeTextAreaValueSetter : nativeInputValueSetter;
  
  if (setter) {
    setter.call(element, value);
  } else {
    element.value = value;
  }
  
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  
  // For React 16+
  const tracker = element._valueTracker;
  if (tracker) {
    tracker.setValue('');
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

// Find element from recorded action
async function findRecordedElement(action, timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    // Try each selector
    if (action.selectors) {
      for (const selector of action.selectors) {
        try {
          const element = document.querySelector(selector);
          if (element && isVisible(element)) return element;
        } catch (e) {}
      }
    }
    
    // Fallback by input type
    if (action.inputType) {
      const element = findByInputType(action.inputType);
      if (element) return element;
    }
    
    await sleep(200);
  }
  
  return null;
}

// Find input by type
function findByInputType(inputType) {
  if (inputType === 'password') {
    return document.querySelector('input[type="password"]');
  }
  if (inputType === 'email' || inputType === 'text') {
    return document.querySelector('input[type="email"], input[type="text"]:not([type="password"])');
  }
  return null;
}

// Auto-fill if we have saved credentials for this domain
async function autoFillIfSaved() {
  const currentDomain = window.location.hostname;
  console.log('[ScrapAI] Checking for saved credentials for:', currentDomain);
  
  // Check manually saved sites for auto-replay
  const { sites } = await chrome.storage.local.get(['sites']);
  if (sites) {
    const matchingSite = sites.find(site => {
      try {
        return new URL(site.url).hostname === currentDomain;
      } catch {
        return false;
      }
    });
    
    if (matchingSite && matchingSite.actions?.length > 0) {
      console.log('[ScrapAI] Found saved actions, auto-replaying...');
      showNotification('Connexion automatique...', false);
      await waitForPageLoad();
      await sleep(1000);
      await executeReplayActions({ actions: matchingSite.actions });
    }
  }
}

// Setup action recorder (for manual recording)
function setupActionRecorder() {
  console.log('[ScrapAI] Recording mode active');
  
  // Create recording UI
  const panel = document.createElement('div');
  panel.id = 'scrapai-recording-panel';
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: white;
    padding: 24px;
    border-radius: 16px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    min-width: 280px;
    text-align: center;
  `;
  
  panel.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 12px;">🔴</div>
    <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Enregistrement en cours</div>
    <div id="scrapai-action-count" style="font-size: 14px; color: #71717a; margin-bottom: 20px;">0 actions</div>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="scrapai-cancel" style="
        padding: 10px 20px;
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
      ">Annuler</button>
      <button id="scrapai-save" style="
        padding: 10px 20px;
        background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
      ">Sauvegarder</button>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Track actions
  let recordedActions = [];
  
  // Update counter
  function updateCounter() {
    const counter = document.getElementById('scrapai-action-count');
    if (counter) {
      counter.textContent = `${recordedActions.length} action${recordedActions.length !== 1 ? 's' : ''}`;
    }
  }
  
  // Build selectors for an element
  function buildSelectors(element) {
    const selectors = [];
    
    if (element.id) {
      selectors.push(`#${element.id}`);
    }
    
    if (element.name) {
      selectors.push(`[name="${element.name}"]`);
    }
    
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).filter(c => c && !c.includes(':'));
      if (classes.length > 0 && classes.length <= 3) {
        selectors.push(`.${classes.join('.')}`);
      }
    }
    
    // Build path selector
    const path = [];
    let el = element;
    while (el && el !== document.body && path.length < 4) {
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector = `#${el.id}`;
        path.unshift(selector);
        break;
      }
      path.unshift(selector);
      el = el.parentElement;
    }
    if (path.length > 0) {
      selectors.push(path.join(' > '));
    }
    
    return selectors;
  }
  
  // Record click
  document.addEventListener('click', (e) => {
    if (e.target.closest('#scrapai-recording-panel')) return;
    
    const action = {
      type: 'click',
      selectors: buildSelectors(e.target),
      timestamp: Date.now()
    };
    
    recordedActions.push(action);
    chrome.runtime.sendMessage({ type: 'ADD_ACTION', action });
    updateCounter();
  }, true);
  
  // Record input
  document.addEventListener('input', (e) => {
    if (e.target.closest('#scrapai-recording-panel')) return;
    
    const action = {
      type: 'input',
      selectors: buildSelectors(e.target),
      value: e.target.value,
      inputType: e.target.type || 'text',
      timestamp: Date.now()
    };
    
    // Update or add
    const existingIndex = recordedActions.findIndex(a => 
      a.type === 'input' && a.inputType === action.inputType
    );
    
    if (existingIndex >= 0) {
      recordedActions[existingIndex] = action;
    } else {
      recordedActions.push(action);
    }
    
    chrome.runtime.sendMessage({ type: 'ADD_ACTION', action });
    updateCounter();
  }, true);
  
  // Record Enter key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.target.closest('#scrapai-recording-panel')) {
      const action = {
        type: 'enter',
        selectors: buildSelectors(e.target),
        timestamp: Date.now()
      };
      
      recordedActions.push(action);
      chrome.runtime.sendMessage({ type: 'ADD_ACTION', action });
      updateCounter();
    }
  }, true);
  
  // Cancel button
  document.getElementById('scrapai-cancel').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    panel.remove();
  });
  
  // Save button
  document.getElementById('scrapai-save').addEventListener('click', () => {
    chrome.runtime.sendMessage({ 
      type: 'SAVE_SITE',
      url: window.location.href
    }, (response) => {
      if (response?.success) {
        showNotification(`${response.count} actions sauvegardées !`, false);
      }
      panel.remove();
    });
  });
}
