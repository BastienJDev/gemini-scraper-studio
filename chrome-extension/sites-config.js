// Predefined site configurations with action sequences
const SITES_CONFIG = {
  dalloz: {
    name: "Dalloz",
    icon: "📚",
    description: "Base de données juridique via BU",
    startUrl: "https://catalogue-bu.u-bourgogne.fr/discovery/dbsearch?vid=33UB_INST:33UB_INST&lang=fr",
    credentials: {
      username: "",
      password: ""
    },
    actions: [
      { type: "click", selector: "button[name=\"S'inscrire\"], button:has-text('S\\'inscrire')", role: "button", roleName: "S'inscrire", delay: 1000 },
      { type: "waitForSelector", selector: "#username", timeout: 10000 },
      { type: "fill", selector: "#username", valueKey: "username", delay: 500 },
      { type: "fill", selector: "#password", valueKey: "password", delay: 500 },
      { type: "click", selector: "button[name='CONNEXION'], button:has-text('CONNEXION')", role: "button", roleName: "CONNEXION", delay: 2000 },
      { type: "waitForNavigation", delay: 3000 },
      { type: "click", selector: "[role='combobox'][name='Rechercher'], input[aria-label='Rechercher']", delay: 1000 },
      { type: "fill", selector: "[role='combobox'][name='Rechercher'], input[aria-label='Rechercher']", value: "dalloz", delay: 1000 },
      { type: "click", selector: "[role='option']:has-text('Dalloz')", delay: 1500 },
      { type: "click", selector: "a:has-text('Dalloz'):not(:has-text('Base de données'))", delay: 2000 },
      { type: "click", selector: "a:has-text('Dalloz - Base de données')", delay: 1000, opensPopup: true }
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
