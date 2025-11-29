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
  
  // Store credentials as user types (before form submission clears them)
  let capturedUsername = '';
  let capturedPassword = '';
  let usernameField = null;
  let passwordField = null;
  
  // Show recording indicator with stop button
  const indicator = document.createElement('div');
  indicator.id = 'scrapai-recording';
  indicator.innerHTML = `
    <style>
      #scrapai-recording {
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: #ef4444;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-family: -apple-system, sans-serif;
        font-size: 14px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      #scrapai-recording .dot {
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        animation: pulse 1s infinite;
      }
      #scrapai-recording .stop-btn {
        background: white;
        color: #ef4444;
        border: none;
        padding: 4px 12px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
      }
      #scrapai-recording .stop-btn:hover {
        background: #fee2e2;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
    <span class="dot"></span>
    <span>Enregistrement...</span>
    <button class="stop-btn" id="scrapai-stop-btn">Arrêter</button>
  `;
  document.body.appendChild(indicator);
  
  // Handle stop button click
  document.getElementById('scrapai-stop-btn').addEventListener('click', () => {
    chrome.storage.local.set({ isRecording: false }, () => {
      indicator.remove();
      showNotification('✓ Enregistrement arrêté');
    });
  });

  // Track input values in real-time
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (target.type === 'password') {
      capturedPassword = target.value;
      passwordField = target;
      console.log('[ScrapAI] Password capturé');
    } else if (target.type === 'email' || target.type === 'text' || target.name === 'username' || target.name === 'email' || target.name === 'login') {
      // Only capture if it looks like a username/email field near a password field
      const form = target.closest('form') || document;
      if (form.querySelector('input[type="password"]')) {
        capturedUsername = target.value;
        usernameField = target;
        console.log('[ScrapAI] Username capturé');
      }
    }
  }, true);

  // Capture on form submission
  const saveLogin = () => {
    if (!capturedPassword || !capturedUsername) {
      console.log('[ScrapAI] Credentials manquants:', { hasUser: !!capturedUsername, hasPass: !!capturedPassword });
      return;
    }

    const site = {
      url: window.location.href,
      username: capturedUsername,
      password: capturedPassword,
      usernameSelector: usernameField ? buildSelector(usernameField) : 'input[type="email"], input[name="email"], input[name="username"]',
      passwordSelector: passwordField ? buildSelector(passwordField) : 'input[type="password"]',
      submitSelector: 'button[type="submit"], input[type="submit"], button:not([type])'
    };

    console.log('[ScrapAI] Login capturé:', { ...site, password: '***' });

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
      
      chrome.storage.local.set({ sites }, () => {
        showNotification('✓ Login enregistré ! Clique sur Arrêter quand tu as fini.');
      });
    });
  };

  // Track form submissions
  document.addEventListener('submit', saveLogin, true);
  
  // Track click on buttons that might submit
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, input[type="submit"], [role="button"]');
    if (btn) {
      setTimeout(saveLogin, 100);
    }
  }, true);
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
