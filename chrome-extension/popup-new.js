// Popup controller for ScrapAI Auto-Login

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  renderSitesGrid();
  await loadSavedSites();
});

// Render the predefined sites grid
function renderSitesGrid() {
  const grid = document.getElementById('sitesGrid');
  grid.innerHTML = '';
  
  for (const [siteId, config] of Object.entries(SITES_CONFIG)) {
    const isDisabled = !config.startUrl;
    
    const card = document.createElement('div');
    card.className = `site-card ${isDisabled ? 'disabled' : ''}`;
    card.dataset.siteId = siteId;
    
    card.innerHTML = `
      <div class="site-icon">${config.icon}</div>
      <div class="site-name">${config.name}</div>
      <div class="site-desc">${config.description}</div>
      <div class="site-status ${isDisabled ? 'coming-soon' : 'ready'}">
        ${isDisabled ? '🚧 Bientôt' : '▶ Cliquer pour lancer'}
      </div>
    `;
    
    if (!isDisabled) {
      card.addEventListener('click', () => startLogin(siteId));
    }
    
    grid.appendChild(card);
  }
}

// Start the login process directly with hardcoded credentials
async function startLogin(siteId) {
  const config = SITES_CONFIG[siteId];
  
  if (!config || !config.startUrl) {
    showStatus('Configuration du site invalide', 'error');
    return;
  }
  
  showStatus('Préparation de la connexion...', 'info');
  
  // Use credentials from config
  const credentials = config.credentials || {};
  
  // Store the login task
  const loginTask = {
    siteId,
    config: {
      ...config,
      credentials
    },
    startedAt: Date.now()
  };
  
  // Set storage and wait for it to complete
  await new Promise((resolve) => {
    chrome.storage.local.set({ pendingLogin: loginTask }, () => {
      console.log('[ScrapAI Popup] Login task stored:', loginTask);
      resolve();
    });
  });
  
  // Small delay to ensure storage is ready
  await new Promise(r => setTimeout(r, 100));
  
  showStatus('Ouverture de ' + config.name + '...', 'info');
  
  // Open the site in a new tab
  chrome.tabs.create({ url: config.startUrl }, (tab) => {
    console.log('[ScrapAI Popup] Tab created:', tab.id);
    window.close();
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
  if (status) {
    status.textContent = message;
    status.className = `status ${type}`;
  }
}
