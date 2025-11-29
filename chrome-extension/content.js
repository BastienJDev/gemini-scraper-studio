// Content script - Record and replay user actions
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
  
  // Load existing recorded actions (persisted across page loads)
  let { recordedActions = [], recordingStartTime = Date.now(), recordingDomain = '' } = 
    await chrome.storage.local.get(['recordedActions', 'recordingStartTime', 'recordingDomain']);
  
  const currentDomain = window.location.hostname;
  
  // If we're on a different domain, reset recording
  if (recordingDomain && recordingDomain !== currentDomain) {
    recordedActions = [];
    recordingStartTime = Date.now();
  }
  
  // Save current domain
  await chrome.storage.local.set({ 
    recordingDomain: currentDomain,
    recordingStartTime: recordingStartTime 
  });
  
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
    <div class="count" id="scrapai-count">${recordedActions.length} actions</div>
    <div class="buttons">
      <button class="stop-btn" id="scrapai-stop">Annuler</button>
      <button class="save-btn" id="scrapai-save">Sauvegarder</button>
    </div>
  `;
  document.body.appendChild(panel);
  
  const countEl = document.getElementById('scrapai-count');
  
  // Helper to save actions to storage
  const saveActionsToStorage = async () => {
    await chrome.storage.local.set({ recordedActions });
    countEl.textContent = `${recordedActions.length} actions`;
  };
  
  // Record clicks
  document.addEventListener('click', async (e) => {
    if (e.target.closest('#scrapai-recorder')) return;
    
    const action = {
      type: 'click',
      time: Date.now() - recordingStartTime,
      selector: buildSelector(e.target),
      x: e.clientX,
      y: e.clientY
    };
    recordedActions.push(action);
    await saveActionsToStorage();
    console.log('[ScrapAI] Click enregistré:', action.selector);
  }, true);
  
  // Record typing
  document.addEventListener('input', async (e) => {
    if (e.target.closest('#scrapai-recorder')) return;
    if (!e.target.matches('input, textarea')) return;
    
    const selector = buildSelector(e.target);
    // Update existing input action instead of creating duplicates
    const existingIndex = recordedActions.findIndex(a => a.type === 'input' && a.selector === selector);
    
    const action = {
      type: 'input',
      time: Date.now() - recordingStartTime,
      selector: selector,
      value: e.target.value,
      inputType: e.target.type || 'text'
    };
    
    if (existingIndex >= 0) {
      recordedActions[existingIndex] = action;
    } else {
      recordedActions.push(action);
    }
    await saveActionsToStorage();
    console.log('[ScrapAI] Input enregistré:', action.selector);
  }, true);
  
  // Record Enter key (form submit)
  document.addEventListener('keydown', async (e) => {
    if (e.target.closest('#scrapai-recorder')) return;
    if (e.key === 'Enter') {
      const action = {
        type: 'enter',
        time: Date.now() - recordingStartTime,
        selector: buildSelector(e.target)
      };
      recordedActions.push(action);
      await saveActionsToStorage();
    }
  }, true);
  
  // Cancel button
  document.getElementById('scrapai-stop').addEventListener('click', async () => {
    await chrome.storage.local.set({ 
      isRecording: false, 
      recordedActions: [],
      recordingDomain: ''
    });
    panel.remove();
    showNotification('Enregistrement annulé');
  });
  
  // Save button
  document.getElementById('scrapai-save').addEventListener('click', async () => {
    if (recordedActions.length === 0) {
      alert('Aucune action enregistrée !');
      return;
    }
    
    const site = {
      url: window.location.href,
      actions: recordedActions,
      recordedAt: new Date().toISOString()
    };
    
    // Extract username/password from recorded inputs for display
    const inputs = recordedActions.filter(a => a.type === 'input');
    const passwordInput = inputs.find(a => a.inputType === 'password');
    const usernameInput = inputs.find(a => a.inputType !== 'password');
    
    if (usernameInput) site.username = usernameInput.value;
    if (passwordInput) site.password = passwordInput.value;
    
    console.log('[ScrapAI] Sauvegarde:', recordedActions.length, 'actions');
    
    const { sites = [] } = await chrome.storage.local.get('sites');
    const domain = new URL(site.url).hostname;
    const existingIndex = sites.findIndex(s => {
      try { return new URL(s.url).hostname === domain; } catch { return false; }
    });
    
    if (existingIndex >= 0) {
      sites[existingIndex] = site;
    } else {
      sites.push(site);
    }
    
    await chrome.storage.local.set({ 
      sites, 
      isRecording: false,
      recordedActions: [],
      recordingDomain: ''
    });
    
    panel.remove();
    showNotification(`✓ ${recordedActions.length} actions sauvegardées !`);
  });
}

function buildSelector(element) {
  if (element.id) return `#${element.id}`;
  if (element.name) return `${element.tagName.toLowerCase()}[name="${element.name}"]`;
  if (element.type && element.tagName === 'INPUT') {
    return `input[type="${element.type}"]`;
  }
  
  // Build a path
  const path = [];
  let el = element;
  while (el && el !== document.body) {
    let selector = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) selector += '.' + classes;
    }
    path.unshift(selector);
    el = el.parentElement;
  }
  return path.slice(-3).join(' > ');
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
  
  const matchingSite = sites.find(site => {
    try {
      return new URL(site.url).hostname === currentDomain;
    } catch {
      return false;
    }
  });

  if (!matchingSite) return;
  
  // If site has recorded actions, replay them
  if (matchingSite.actions && matchingSite.actions.length > 0) {
    console.log('[ScrapAI] Replay de', matchingSite.actions.length, 'actions...');
    showNotification('▶ Connexion automatique...');
    
    setTimeout(() => replayActions(matchingSite.actions), 1000);
  }
}

async function replayActions(actions) {
  for (const action of actions) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const element = document.querySelector(action.selector);
    if (!element) {
      console.warn('[ScrapAI] Element non trouvé:', action.selector);
      continue;
    }
    
    if (action.type === 'click') {
      element.click();
      console.log('[ScrapAI] Click:', action.selector);
    } else if (action.type === 'input') {
      element.focus();
      element.value = action.value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[ScrapAI] Input:', action.selector);
    } else if (action.type === 'enter') {
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const form = element.closest('form');
      if (form) form.submit();
    }
  }
  
  showNotification('✓ Actions rejouées !');
}
