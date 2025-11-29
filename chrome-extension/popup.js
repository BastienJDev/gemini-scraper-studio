document.addEventListener('DOMContentLoaded', async () => {
  const recordBtn = document.getElementById('recordBtn');
  const stopBtn = document.getElementById('stopBtn');
  const recordUrl = document.getElementById('recordUrl');
  const recordSection = document.getElementById('recordSection');
  const recordingStatus = document.getElementById('recordingStatus');
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

  // Check if already recording
  const { isRecording } = await chrome.storage.local.get('isRecording');
  updateRecordingUI(isRecording);

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
    const targetUrl = recordUrl.value.trim();
    
    if (!targetUrl) {
      showStatus('Entre l\'URL de la page de login', 'error');
      return;
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      showStatus('URL invalide', 'error');
      return;
    }

    // Enable recording mode
    await chrome.storage.local.set({ isRecording: true });
    updateRecordingUI(true);
    
    // Open new tab with the target URL
    chrome.tabs.create({ url: targetUrl });
    
    showStatus('Enregistrement activé ! Connecte-toi sur le site.', 'success');
  });

  // Stop recording button
  stopBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ isRecording: false });
    updateRecordingUI(false);
    showStatus('Enregistrement arrêté', 'success');
  });

  function updateRecordingUI(isRecording) {
    if (isRecording) {
      recordingStatus.classList.remove('hidden');
      recordBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
      recordSection.classList.add('recording-active');
    } else {
      recordingStatus.classList.add('hidden');
      recordBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
      recordSection.classList.remove('recording-active');
    }
  }

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
      const actionCount = site.actions ? site.actions.length : 0;
      const info = actionCount > 0 ? `${actionCount} actions` : (site.username || '');
      return `
        <div class="site-item">
          <div class="site-info">
            <span class="domain">${domain}</span>
            <span class="meta">${info}</span>
          </div>
          <div class="actions">
            <button class="btn-secondary" data-action="login" data-index="${index}">▶</button>
            <button class="btn-secondary btn-delete" data-action="delete" data-index="${index}">×</button>
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
          // Just open the page - content.js will auto-replay actions
          chrome.tabs.create({ url: site.url });
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
