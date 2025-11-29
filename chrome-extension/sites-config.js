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
      { type: "click", selector: "span[translate='eshelf.signin.title'], span:has-text('S\\'identifier')", role: "button", roleName: "S'identifier", delay: 2000 },
      { type: "waitForSelector", selector: "#username", timeout: 15000 },
      { type: "fill", selector: "#username", valueKey: "username", delay: 500 },
      { type: "fill", selector: "#password", valueKey: "password", delay: 500 },
      { type: "click", selector: "button[name='submitBtn'], button.btn-primary[type='submit']", role: "button", roleName: "CONNEXION", delay: 4000 },
      { type: "waitForSelector", selector: "#searchBarJournal", timeout: 15000 },
      { type: "fill", selector: "#searchBarJournal", value: "Dalloz", delay: 500 },
      { type: "click", selector: "button.submit-button.button-confirm, button[aria-label='Soumettre la recherche']", delay: 2000 },
      { type: "click", selector: "mark:has-text('Dalloz'), span:has-text('Dalloz')", delay: 2000 },
      { type: "click", selector: "a.item-title:has-text('Dalloz - Base de données')", delay: 2000 }
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
