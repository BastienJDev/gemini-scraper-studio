// Content script - Auto-detect and record login
(async () => {
  // Check if recording mode is active
  const { isRecording } = await chrome.storage.local.get('isRecording');
  
  if (isRecording) {
    // RECORDING MODE - Capture user's login
    setupRecording();
  } else {
    // AUTO-FILL MODE - Fill saved credentials
    autoFillIfSaved();
  }
})();

function setupRecording() {
  console.log('[ScrapAI] Mode enregistrement activé');
  
  // Show floating save form
  const panel = document.createElement('div');
  panel.id = 'scrapai-recording';
  panel.innerHTML = `
    <style>
      #scrapai-recording {
        position: fixed;
        top: 10px;
        right: 10px;
        background: #1e293b;
        color: white;
        padding: 16px;
        border-radius: 12px;
        font-family: -apple-system, sans-serif;
        font-size: 13px;
        z-index: 999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        width: 280px;
      }
      #scrapai-recording .header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: #ef4444;
        font-weight: 600;
      }
      #scrapai-recording .dot {
        width: 8px;
        height: 8px;
        background: #ef4444;
        border-radius: 50%;
        animation: pulse 1s infinite;
      }
      #scrapai-recording input {
        width: 100%;
        padding: 8px 10px;
        margin-bottom: 8px;
        border: 1px solid #334155;
        border-radius: 6px;
        background: #0f172a;
        color: white;
        font-size: 13px;
        box-sizing: border-box;
      }
      #scrapai-recording input::placeholder {
        color: #64748b;
      }
      #scrapai-recording .buttons {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      #scrapai-recording button {
        flex: 1;
        padding: 8px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
      }
      #scrapai-recording .save-btn {
        background: #22c55e;
        color: white;
      }
      #scrapai-recording .save-btn:hover {
        background: #16a34a;
      }
      #scrapai-recording .cancel-btn {
        background: #475569;
        color: white;
      }
      #scrapai-recording .cancel-btn:hover {
        background: #64748b;
      }
      #scrapai-recording .info {
        font-size: 11px;
        color: #94a3b8;
        margin-bottom: 12px;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
    <div class="header">
      <span class="dot"></span>
      <span>Enregistrement du login</span>
    </div>
    <div class="info">Connecte-toi d'abord, puis entre tes identifiants ci-dessous :</div>
    <input type="text" id="scrapai-username" placeholder="Email ou nom d'utilisateur" />
    <input type="password" id="scrapai-password" placeholder="Mot de passe" />
    <div class="buttons">
      <button class="cancel-btn" id="scrapai-cancel">Annuler</button>
      <button class="save-btn" id="scrapai-save">Sauvegarder</button>
    </div>
  `;
  document.body.appendChild(panel);
  
  // Handle cancel
  document.getElementById('scrapai-cancel').addEventListener('click', () => {
    chrome.storage.local.set({ isRecording: false }, () => {
      panel.remove();
      showNotification('Enregistrement annulé');
    });
  });
  
  // Handle save
  document.getElementById('scrapai-save').addEventListener('click', () => {
    const username = document.getElementById('scrapai-username').value.trim();
    const password = document.getElementById('scrapai-password').value;
    
    if (!username || !password) {
      alert('Entre ton email et mot de passe');
      return;
    }
    
    // Try to find selectors on the page
    const passwordField = document.querySelector('input[type="password"]');
    const form = passwordField ? passwordField.closest('form') : document;
    const usernameField = form ? form.querySelector('input[type="email"], input[name="email"], input[name="username"], input[type="text"]') : null;
    const submitBtn = form ? form.querySelector('button[type="submit"], input[type="submit"], button') : null;
    
    const site = {
      url: window.location.href,
      username: username,
      password: password,
      usernameSelector: usernameField ? buildSelector(usernameField) : 'input[type="email"], input[name="email"], input[name="username"]',
      passwordSelector: passwordField ? buildSelector(passwordField) : 'input[type="password"]',
      submitSelector: submitBtn ? buildSelector(submitBtn) : 'button[type="submit"], input[type="submit"]'
    };
    
    console.log('[ScrapAI] Login sauvegardé:', { ...site, password: '***' });
    
    chrome.storage.local.get('sites', ({ sites = [] }) => {
      const domain = new URL(site.url).hostname;
      const existingIndex = sites.findIndex(s => {
        try { return new URL(s.url).hostname === domain; } catch { return false; }
      });
      
      if (existingIndex >= 0) {
        sites[existingIndex] = site;
      } else {
        sites.push(site);
      }
      
      chrome.storage.local.set({ sites, isRecording: false }, () => {
        panel.remove();
        showNotification('✓ Login sauvegardé !');
      });
    });
  });
}


function buildSelector(element) {
  // Try ID first
  if (element.id) return `#${element.id}`;
  
  // Try name
  if (element.name) return `${element.tagName.toLowerCase()}[name="${element.name}"]`;
  
  // Try type for inputs
  if (element.type && element.tagName === 'INPUT') {
    return `input[type="${element.type}"]`;
  }
  
  // Fallback to tag
  return element.tagName.toLowerCase();
}

function showNotification(message) {
  const notif = document.createElement('div');
  notif.innerHTML = `
    <style>
      .scrapai-notif {
        position: fixed;
        top: 10px;
        right: 10px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, sans-serif;
        font-size: 14px;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
    <div class="scrapai-notif">${message}</div>
  `;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 4000);
}

async function autoFillIfSaved() {
  // Check if this looks like a login page
  const hasPasswordField = document.querySelector('input[type="password"]');
  if (!hasPasswordField) return;

  // Check if we have saved credentials for this domain
  const { sites = [] } = await chrome.storage.local.get('sites');
  const currentDomain = window.location.hostname;
  
  const matchingSite = sites.find(site => {
    try {
      return new URL(site.url).hostname === currentDomain;
    } catch {
      return false;
    }
  });

  if (matchingSite) {
    console.log('[ScrapAI] Site reconnu, remplissage auto...');
    
    setTimeout(() => {
      // Find username field
      const usernameField = document.querySelector(matchingSite.usernameSelector);
      if (usernameField && !usernameField.value) {
        usernameField.value = matchingSite.username;
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        usernameField.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Find password field  
      const passwordField = document.querySelector(matchingSite.passwordSelector);
      if (passwordField && !passwordField.value) {
        passwordField.value = matchingSite.password;
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('change', { bubbles: true }));
      }

      showNotification('✓ Identifiants remplis automatiquement');
    }, 1000);
  }
}
