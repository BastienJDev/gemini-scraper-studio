// Popup controller for ScrapAI Auto-Login
let currentConfigSite = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await renderSitesGrid();
  await loadSavedSites();
  setupEventListeners();
});

// Render the predefined sites grid
async function renderSitesGrid() {
  const grid = document.getElementById('sitesGrid');
  const storedCredentials = await getStoredCredentials();
  
  grid.innerHTML = '';
  
  for (const [siteId, config] of Object.entries(SITES_CONFIG)) {
    const hasCredentials = storedCredentials[siteId]?.username && storedCredentials[siteId]?.password;
    const isDisabled = !config.startUrl;
    
    const card = document.createElement('div');
    card.className = `site-card ${isDisabled ? 'disabled' : ''}`;
    card.dataset.siteId = siteId;
    
    card.innerHTML = `
      <div class="site-icon">${config.icon}</div>
      <div class="site-name">${config.name}</div>
      <div class="site-desc">${config.description}</div>
      <div class="site-status ${hasCredentials ? 'configured' : 'not-configured'}">
        ${isDisabled ? '🚧 Bientôt' : (hasCredentials ? '✓ Configuré' : '⚙️ À configurer')}
      </div>
    `;
    
    if (!isDisabled) {
      card.addEventListener('click', () => openSiteConfig(siteId));
    }
    
    grid.appendChild(card);
  }
}

// Open site configuration panel
async function openSiteConfig(siteId) {
  currentConfigSite = siteId;
  const config = SITES_CONFIG[siteId];
  const storedCredentials = await getStoredCredentials();
  const creds = storedCredentials[siteId] || {};
  
  // Use stored credentials, or fallback to hardcoded defaults from config
  const defaultCreds = config.credentials || {};
  
  document.getElementById('configSiteIcon').textContent = config.icon;
  document.getElementById('configSiteName').textContent = config.name;
  document.getElementById('siteUsername').value = creds.username || defaultCreds.username || '';
  document.getElementById('sitePassword').value = creds.password || defaultCreds.password || '';
  
  document.getElementById('credentialsSection').classList.add('active');
  hideStatus();
}

// Setup event listeners
function setupEventListeners() {
  // Close credentials panel
  document.getElementById('closeCredentials').addEventListener('click', () => {
    document.getElementById('credentialsSection').classList.remove('active');
    currentConfigSite = null;
  });
  
  // Save credentials
  document.getElementById('saveCredentials').addEventListener('click', async () => {
    if (!currentConfigSite) return;
    
    const username = document.getElementById('siteUsername').value.trim();
    const password = document.getElementById('sitePassword').value;
    
    if (!username || !password) {
      showStatus('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    await saveCredentials(currentConfigSite, username, password);
    showStatus('Identifiants sauvegardés !', 'success');
    await renderSitesGrid();
  });
  
  // Connect now
  document.getElementById('connectNow').addEventListener('click', async () => {
    if (!currentConfigSite) return;
    
    const username = document.getElementById('siteUsername').value.trim();
    const password = document.getElementById('sitePassword').value;
    
    if (!username || !password) {
      showStatus('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    // Save credentials first
    await saveCredentials(currentConfigSite, username, password);
    
    // Start the login process
    await startLogin(currentConfigSite, username, password);
  });
}

// Get stored credentials from chrome.storage
async function getStoredCredentials() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['siteCredentials'], (result) => {
      resolve(result.siteCredentials || {});
    });
  });
}

// Save credentials for a site
async function saveCredentials(siteId, username, password) {
  const credentials = await getStoredCredentials();
  credentials[siteId] = { username, password };
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ siteCredentials: credentials }, resolve);
  });
}

// Start the login process
async function startLogin(siteId, username, password) {
  const config = SITES_CONFIG[siteId];
  
  if (!config || !config.startUrl) {
    showStatus('Configuration du site invalide', 'error');
    return;
  }
  
  showStatus('Ouverture du site...', 'info');
  
  // Store the login task
  const loginTask = {
    siteId,
    config: {
      ...config,
      credentials: { username, password }
    },
    startedAt: Date.now()
  };
  
  await new Promise((resolve) => {
    chrome.storage.local.set({ pendingLogin: loginTask }, resolve);
  });
  
  // Open the site in a new tab
  chrome.tabs.create({ url: config.startUrl }, (tab) => {
    showStatus('Connexion en cours...', 'info');
  });
}

// Load manually saved sites
async function loadSavedSites() {
  const container = document.getElementById('savedSites');
  
  chrome.storage.local.get(['sites'], (result) => {
    const sites = result.sites || [];
    
    if (sites.length === 0) {
      container.innerHTML = `
        <p style="font-size: 12px; color: #71717a; text-align: center; padding: 20px;">
          Aucun site enregistré manuellement
        </p>
      `;
      return;
    }
    
    container.innerHTML = sites.map((site, index) => {
      const domain = getDomain(site.url);
      return `
        <div class="saved-site-item" data-index="${index}">
          <div class="saved-site-info">
            <span class="saved-site-icon">🌐</span>
            <div>
              <div class="saved-site-name">${domain}</div>
              <div class="saved-site-url">${site.username || 'Enregistré'}</div>
            </div>
          </div>
          <div class="saved-site-actions">
            <button class="action-btn connect" data-index="${index}">Connecter</button>
            <button class="action-btn delete" data-index="${index}">✕</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Add event listeners
    container.querySelectorAll('.action-btn.connect').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        connectToSavedSite(sites[index]);
      });
    });
    
    container.querySelectorAll('.action-btn.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        deleteSavedSite(index);
      });
    });
  });
}

// Connect to a manually saved site
function connectToSavedSite(site) {
  chrome.storage.local.set({ 
    pendingReplay: {
      url: site.url,
      actions: site.actions
    }
  }, () => {
    chrome.tabs.create({ url: site.url });
  });
}

// Delete a saved site
function deleteSavedSite(index) {
  chrome.storage.local.get(['sites'], (result) => {
    const sites = result.sites || [];
    sites.splice(index, 1);
    chrome.storage.local.set({ sites }, () => {
      loadSavedSites();
    });
  });
}

// Helper functions
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
}

function hideStatus() {
  const status = document.getElementById('status');
  status.className = 'status';
}
