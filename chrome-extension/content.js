// Content script - Record and replay user actions via background script
(async () => {
  const { isRecording } = await chrome.storage.local.get('isRecording');
  
  if (isRecording) {
    setupActionRecorder();
  } else {
    autoFillIfSaved();
  }
})();

async function setupActionRecorder() {
  console.log('[ScrapAI] Enregistreur d\'actions activé');
  
  // Get current state from background script
  const state = await chrome.runtime.sendMessage({ type: 'GET_RECORDING_STATE' });
  const startTime = state.startTime || Date.now();
  let actionCount = state.count || 0;
  
  // If not recording in background, start it
  if (!state.isRecording) {
    await chrome.runtime.sendMessage({ 
      type: 'START_RECORDING', 
      domain: window.location.hostname 
    });
  }
  
  // UI Panel
  const panel = document.createElement('div');
  panel.id = 'scrapai-recorder';
  panel.innerHTML = `
    <style>
      #scrapai-recorder {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1e293b;
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        font-family: -apple-system, sans-serif;
        font-size: 13px;
        z-index: 2147483647;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        min-width: 220px;
      }
      #scrapai-recorder .header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-weight: 600;
      }
      #scrapai-recorder .dot {
        width: 10px;
        height: 10px;
        background: #ef4444;
        border-radius: 50%;
        animation: pulse 1s infinite;
      }
      #scrapai-recorder .count {
        color: #94a3b8;
        font-size: 12px;
        margin-bottom: 10px;
      }
      #scrapai-recorder .buttons {
        display: flex;
        gap: 8px;
      }
      #scrapai-recorder button {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
      }
      #scrapai-recorder .stop-btn {
        background: #ef4444;
        color: white;
      }
      #scrapai-recorder .save-btn {
        background: #22c55e;
        color: white;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    </style>
    <div class="header">
      <span class="dot"></span>
      <span>Enregistrement...</span>
    </div>
    <div class="count" id="scrapai-count">${actionCount} actions</div>
    <div class="buttons">
      <button class="stop-btn" id="scrapai-stop">Annuler</button>
      <button class="save-btn" id="scrapai-save">Sauvegarder</button>
    </div>
  `;
  document.body.appendChild(panel);
  
  const countEl = document.getElementById('scrapai-count');
  
  // Update count display
  const updateCount = (count) => {
    actionCount = count;
    countEl.textContent = `${count} actions`;
  };
  
  // Build multiple selectors for robustness
  function buildSelectors(element) {
    const selectors = [];
    
    // ID selector (most reliable)
    if (element.id) {
      selectors.push(`#${element.id}`);
    }
    
    // Name selector
    if (element.name) {
      selectors.push(`[name="${element.name}"]`);
      selectors.push(`${element.tagName.toLowerCase()}[name="${element.name}"]`);
    }
    
    // Type selector for inputs
    if (element.tagName === 'INPUT' && element.type) {
      selectors.push(`input[type="${element.type}"]`);
    }
    
    // Placeholder selector
    if (element.placeholder) {
      selectors.push(`[placeholder="${element.placeholder}"]`);
    }
    
    // aria-label selector
    if (element.getAttribute('aria-label')) {
      selectors.push(`[aria-label="${element.getAttribute('aria-label')}"]`);
    }
    
    // data-testid selector
    if (element.getAttribute('data-testid')) {
      selectors.push(`[data-testid="${element.getAttribute('data-testid')}"]`);
    }
    
    // Class-based selector
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/);
      if (classes.length > 0 && classes[0]) {
        selectors.push(`${element.tagName.toLowerCase()}.${classes.slice(0, 2).join('.')}`);
      }
    }
    
    // Path-based selector (fallback)
    const path = [];
    let el = element;
    while (el && el !== document.body && path.length < 4) {
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector = `#${el.id}`;
        path.unshift(selector);
        break;
      }
      const siblings = el.parentElement ? Array.from(el.parentElement.children).filter(s => s.tagName === el.tagName) : [];
      if (siblings.length > 1) {
        const index = siblings.indexOf(el) + 1;
        selector += `:nth-of-type(${index})`;
      }
      path.unshift(selector);
      el = el.parentElement;
    }
    if (path.length > 0) {
      selectors.push(path.join(' > '));
    }
    
    return selectors;
  }
  
  // Record clicks
  document.addEventListener('click', async (e) => {
    if (e.target.closest('#scrapai-recorder')) return;
    
    const action = {
      type: 'click',
      time: Date.now() - startTime,
      selectors: buildSelectors(e.target),
      tagName: e.target.tagName,
      innerText: e.target.innerText?.slice(0, 50),
      x: e.clientX,
      y: e.clientY
    };
    
    const response = await chrome.runtime.sendMessage({ type: 'ADD_ACTION', action });
    if (response.success) {
      updateCount(response.count);
      console.log('[ScrapAI] Click enregistré:', action.selectors);
    }
  }, true);
  
  // Record typing
  document.addEventListener('input', async (e) => {
    if (e.target.closest('#scrapai-recorder')) return;
    if (!e.target.matches('input, textarea, [contenteditable]')) return;
    
    const action = {
      type: 'input',
      time: Date.now() - startTime,
      selectors: buildSelectors(e.target),
      value: e.target.value,
      inputType: e.target.type || 'text',
      tagName: e.target.tagName
    };
    
    const response = await chrome.runtime.sendMessage({ type: 'ADD_ACTION', action });
    if (response.success) {
      updateCount(response.count);
      console.log('[ScrapAI] Input enregistré:', action.selectors);
    }
  }, true);
  
  // Record Enter key (form submit)
  document.addEventListener('keydown', async (e) => {
    if (e.target.closest('#scrapai-recorder')) return;
    if (e.key === 'Enter') {
      const action = {
        type: 'enter',
        time: Date.now() - startTime,
        selectors: buildSelectors(e.target)
      };
      
      const response = await chrome.runtime.sendMessage({ type: 'ADD_ACTION', action });
      if (response.success) {
        updateCount(response.count);
      }
    }
  }, true);
  
  // Cancel button
  document.getElementById('scrapai-stop').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    panel.remove();
    showNotification('Enregistrement annulé');
  });
  
  // Save button
  document.getElementById('scrapai-save').addEventListener('click', async () => {
    const state = await chrome.runtime.sendMessage({ type: 'GET_RECORDING_STATE' });
    
    if (state.count === 0) {
      alert('Aucune action enregistrée !');
      return;
    }
    
    const response = await chrome.runtime.sendMessage({ 
      type: 'SAVE_SITE', 
      url: window.location.href 
    });
    
    if (response.success) {
      panel.remove();
      showNotification(`✓ ${response.count} actions sauvegardées !`);
    }
  });
}

function showNotification(message, isError = false) {
  const notif = document.createElement('div');
  notif.innerHTML = `
    <style>
      .scrapai-notif {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${isError ? '#ef4444' : '#22c55e'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, sans-serif;
        font-size: 14px;
        z-index: 2147483647;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
      }
      @keyframes slideIn {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
    <div class="scrapai-notif">${message}</div>
  `;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

async function autoFillIfSaved() {
  const { sites = [] } = await chrome.storage.local.get('sites');
  const currentDomain = window.location.hostname;
  
  console.log('[ScrapAI] Vérification auto-login pour:', currentDomain);
  console.log('[ScrapAI] Sites sauvegardés:', sites.length);
  
  const matchingSite = sites.find(site => {
    try {
      const siteDomain = new URL(site.url).hostname;
      console.log('[ScrapAI] Comparaison:', siteDomain, 'vs', currentDomain);
      return siteDomain === currentDomain;
    } catch {
      return false;
    }
  });

  if (!matchingSite) {
    console.log('[ScrapAI] Aucun site correspondant trouvé');
    return;
  }
  
  console.log('[ScrapAI] Site trouvé:', matchingSite.url);
  console.log('[ScrapAI] Actions:', matchingSite.actions?.length || 0);
  
  // If site has recorded actions, replay them
  if (matchingSite.actions && matchingSite.actions.length > 0) {
    console.log('[ScrapAI] Démarrage replay de', matchingSite.actions.length, 'actions...');
    showNotification('▶ Connexion automatique...');
    
    // Wait for page to be fully loaded
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve));
    }
    
    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    replayActions(matchingSite.actions);
  }
}

// Wait for element to appear in DOM (handles dynamic content)
function waitForElement(action, timeout = 10000) {
  return new Promise((resolve) => {
    const selectors = action.selectors || [action.selector];
    
    // Try to find immediately
    for (const selector of selectors) {
      if (!selector) continue;
      try {
        const el = document.querySelector(selector);
        if (el && el.offsetParent !== null) {
          console.log('[ScrapAI] Element trouvé immédiatement:', selector);
          return resolve(el);
        }
      } catch (e) {}
    }
    
    // Fallback search
    const fallbackEl = findElementFallback(action);
    if (fallbackEl) {
      return resolve(fallbackEl);
    }
    
    // Watch for element to appear
    const observer = new MutationObserver(() => {
      for (const selector of selectors) {
        if (!selector) continue;
        try {
          const el = document.querySelector(selector);
          if (el && el.offsetParent !== null) {
            observer.disconnect();
            console.log('[ScrapAI] Element apparu:', selector);
            return resolve(el);
          }
        } catch (e) {}
      }
      
      const fallback = findElementFallback(action);
      if (fallback) {
        observer.disconnect();
        return resolve(fallback);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    // Timeout
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// Fallback element finder
function findElementFallback(action) {
  if (action.type === 'input') {
    // Try common input patterns
    const queries = [
      `input[type="${action.inputType}"]`,
      'input[type="email"]',
      'input[name*="email"]',
      'input[name*="user"]',
      'input[name*="login"]',
      'input[autocomplete="email"]',
      'input[autocomplete="username"]'
    ];
    
    if (action.inputType === 'password') {
      const pwd = document.querySelector('input[type="password"]');
      if (pwd) return pwd;
    } else {
      for (const q of queries) {
        const el = document.querySelector(q);
        if (el && el.type !== 'password') return el;
      }
    }
  }
  
  if (action.type === 'click' && action.tagName === 'BUTTON') {
    // Find submit button
    const btns = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:not([type="button"])',
      '[role="button"]'
    ];
    for (const q of btns) {
      const el = document.querySelector(q);
      if (el) return el;
    }
  }
  
  return null;
}

// Set input value - works with React/Vue/Angular
function setInputValue(element, value) {
  // Method 1: Native setter (bypasses React)
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
  
  // Trigger all possible events
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }));
  
  // For React 16+
  const tracker = element._valueTracker;
  if (tracker) {
    tracker.setValue('');
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

// Simulate realistic click
function simulateClick(element) {
  element.focus();
  
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  // Mouse events sequence
  ['mousedown', 'mouseup', 'click'].forEach(type => {
    element.dispatchEvent(new MouseEvent(type, {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    }));
  });
  
  // Also try native click
  element.click();
}

async function replayActions(actions) {
  console.log('[ScrapAI] === DÉBUT REPLAY ===');
  console.log('[ScrapAI] Actions à rejouer:', actions.length);
  
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    console.log(`[ScrapAI] Action ${i + 1}/${actions.length}:`, action.type, action.selectors?.[0]);
    
    // Wait between actions
    await new Promise(r => setTimeout(r, 800));
    
    const element = await waitForElement(action);
    
    if (!element) {
      console.error('[ScrapAI] ❌ Element non trouvé:', action);
      showNotification(`Element non trouvé (${i + 1}/${actions.length})`, true);
      continue;
    }
    
    console.log('[ScrapAI] Element trouvé:', element.tagName, element.type || '');
    
    try {
      // Scroll into view
      element.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise(r => setTimeout(r, 200));
      
      if (action.type === 'click') {
        simulateClick(element);
        console.log('[ScrapAI] ✓ Click');
        
      } else if (action.type === 'input') {
        element.focus();
        await new Promise(r => setTimeout(r, 100));
        
        // Clear first
        setInputValue(element, '');
        await new Promise(r => setTimeout(r, 50));
        
        // Set value
        setInputValue(element, action.value);
        console.log('[ScrapAI] ✓ Input:', action.value.slice(0, 3) + '***');
        
      } else if (action.type === 'enter') {
        const form = element.closest('form');
        
        // Dispatch Enter key
        ['keydown', 'keypress', 'keyup'].forEach(type => {
          element.dispatchEvent(new KeyboardEvent(type, {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          }));
        });
        
        // Submit form if exists
        if (form) {
          form.requestSubmit?.() || form.submit();
        }
        
        console.log('[ScrapAI] ✓ Enter');
      }
    } catch (err) {
      console.error('[ScrapAI] Erreur:', err);
    }
  }
  
  console.log('[ScrapAI] === FIN REPLAY ===');
  showNotification('✓ Actions rejouées !');
}
