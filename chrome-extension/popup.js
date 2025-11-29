document.addEventListener('DOMContentLoaded', () => {
  const recordBtn = document.getElementById('recordBtn');
  const toggleManual = document.getElementById('toggleManual');
  const manualForm = document.getElementById('manualForm');
  const urlInput = document.getElementById('url');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameSelectorInput = document.getElementById('usernameSelector');
  const passwordSelectorInput = document.getElementById('passwordSelector');
  const submitSelectorInput = document.getElementById('submitSelector');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');
  const sitesList = document.getElementById('sitesList');

  // Load saved sites
  loadSites();

  // Toggle manual form
  toggleManual.addEventListener('click', () => {
    manualForm.classList.toggle('show');
    toggleManual.textContent = manualForm.classList.contains('show') 
      ? '▲ Masquer les options manuelles' 
      : '▼ Afficher les options manuelles';
  });

  // Record button - Start recording mode
  recordBtn.addEventListener('click', async () => {
    // Enable recording mode
    await chrome.storage.local.set({ isRecording: true });
    
    // Get current tab or create new one
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url && !tab.url.startsWith('chrome://')) {
      // Reload current tab to activate recording
      chrome.tabs.reload(tab.id);
      showStatus('Mode enregistrement activé ! Connecte-toi sur la page.', 'success');
    } else {
      showStatus('Va sur une page de login et clique à nouveau sur Enregistrer', 'error');
    }
    
    // Close popup
    setTimeout(() => window.close(), 1500);
  });

  // Save site manually
  saveBtn.addEventListener('click', async () => {
    const site = {
      url: urlInput.value,
      username: usernameInput.value,
      password: passwordInput.value,
      usernameSelector: usernameSelectorInput.value || 'input[name="email"], input[name="username"], input[type="email"]',
      passwordSelector: passwordSelectorInput.value || 'input[name="password"], input[type="password"]',
      submitSelector: submitSelectorInput.value || 'button[type="submit"], input[type="submit"]'
    };

    if (!site.url || !site.username || !site.password) {
      showStatus('Remplis URL, email et mot de passe', 'error');
      return;
    }

    const { sites = [] } = await chrome.storage.local.get('sites');
    const domain = new URL(site.url).hostname;
    
    // Update or add
    const existingIndex = sites.findIndex(s => {
      try { return new URL(s.url).hostname === domain; } catch { return false; }
    });
    if (existingIndex >= 0) {
      sites[existingIndex] = site;
    } else {
      sites.push(site);
    }

    await chrome.storage.local.set({ sites });
    showStatus('Site sauvegardé !', 'success');
    loadSites();
    clearForm();
  });

  async function loadSites() {
    const { sites = [] } = await chrome.storage.local.get('sites');
    
    if (sites.length === 0) {
      sitesList.innerHTML = '<p style="color: #64748b; font-size: 11px;">Aucun site sauvegardé</p>';
      return;
    }

    sitesList.innerHTML = sites.map((site, index) => {
      let domain;
      try {
        domain = new URL(site.url).hostname;
      } catch {
        domain = site.url;
      }
      return `
        <div class="site-item">
          <span class="domain">${domain}</span>
          <div class="actions">
            <button class="btn-secondary" data-action="login" data-index="${index}">▶ Connecter</button>
            <button class="btn-secondary" data-action="delete" data-index="${index}">×</button>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners
    sitesList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        const index = parseInt(e.target.dataset.index);
        const { sites } = await chrome.storage.local.get('sites');
        
        if (action === 'delete') {
          sites.splice(index, 1);
          await chrome.storage.local.set({ sites });
          loadSites();
        } else if (action === 'login') {
          const site = sites[index];
          const tab = await chrome.tabs.create({ url: site.url });
          
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: performLogin,
                args: [site]
              });
            }
          });
          
          window.close();
        }
      });
    });
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
    setTimeout(() => {
      status.className = 'status';
    }, 3000);
  }

  function clearForm() {
    urlInput.value = '';
    usernameInput.value = '';
    passwordInput.value = '';
    usernameSelectorInput.value = '';
    passwordSelectorInput.value = '';
    submitSelectorInput.value = '';
  }
});

// This function runs in the context of the page
function performLogin(site) {
  const fillAndSubmit = () => {
    // Find username field
    const usernameField = document.querySelector(site.usernameSelector);
    if (usernameField) {
      usernameField.value = site.username;
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Find password field
    const passwordField = document.querySelector(site.passwordSelector);
    if (passwordField) {
      passwordField.value = site.password;
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Find and click submit button
    setTimeout(() => {
      const submitBtn = document.querySelector(site.submitSelector);
      if (submitBtn) {
        submitBtn.click();
      }
    }, 500);
  };

  // Wait a bit for any JS frameworks to initialize
  setTimeout(fillAndSubmit, 1000);
}
