// Predefined site configurations with action sequences
const SITES_CONFIG = {
  dalloz: {
    name: "Dalloz",
    icon: "📚",
    description: "Base de données juridique via BU",
    startUrl: "https://catalogue-bu.u-bourgogne.fr/discovery/dbsearch?vid=33UB_INST:33UB_INST&lang=fr",
    credentials: {
      username: "ep462599",
      password: "Enzomatteo12@"
    },
    actions: [
      { type: "click", selector: "span[translate='eshelf.signin.title'], span:has-text('S\\'identifier'), a:has-text('S\\'identifier'), button:has-text('S\\'identifier')", role: "button", roleName: "S'identifier", delay: 2000 },
      { type: "waitForSelector", selector: "#username, input[name='username'], input[name='j_username'], input[type='email']", timeout: 15000 },
      { type: "fill", selector: "#username, input[name='username'], input[name='j_username'], input[type='email']", valueKey: "username", delay: 500 },
      { type: "fill", selector: "#password, input[name='password'], input[name='j_password'], input[type='password']", valueKey: "password", delay: 500 },
      { type: "click", selector: "button[type='submit'], input[type='submit'], button:has-text('Connexion'), button:has-text('CONNEXION'), button:has-text('Se connecter')", role: "button", roleName: "Connexion", delay: 3000 },
      { type: "waitForNavigation", delay: 4000 },
      { type: "click", selector: "input[type='search'], input[placeholder*='Rechercher'], input[aria-label*='Rechercher'], [role='combobox']", delay: 1500 },
      { type: "fill", selector: "input[type='search'], input[placeholder*='Rechercher'], input[aria-label*='Rechercher'], [role='combobox']", value: "dalloz", delay: 1000 },
      { type: "click", selector: "[role='option']:has-text('Dalloz'), li:has-text('Dalloz'), a:has-text('Dalloz')", delay: 2000 },
      { type: "click", selector: "a:has-text('Dalloz - Base de données'), a:has-text('Dalloz'):has-text('Base')", delay: 2000, opensPopup: true }
    ]
  },
  droitdusport: {
    name: "Droit du Sport",
    icon: "⚽",
    description: "Base de données Droit du Sport",
    startUrl: "",
    credentials: {
      username: "",
      password: ""
    },
    actions: []
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SITES_CONFIG;
}
