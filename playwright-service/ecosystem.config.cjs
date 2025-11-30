module.exports = {
  apps: [
    {
      name: "playwright-scraper",
      script: "server.js",
      cwd: __dirname,
      env: {
        PORT: 4000,
      },
    },
  ],
};
