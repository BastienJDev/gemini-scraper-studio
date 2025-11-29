// Content script - Auto-detect login pages and offer to fill
(async () => {
  // Check if this looks like a login page
  const hasPasswordField = document.querySelector('input[type="password"]');
  const hasEmailField = document.querySelector('input[type="email"], input[name="email"], input[name="username"]');
  
  if (!hasPasswordField || !hasEmailField) return;

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
    // Auto-fill after a short delay
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

      console.log('[ScrapAI] Identifiants remplis automatiquement');
    }, 1500);
  }
})();
