const app = require("../app");

const stack = app._router?.stack || app.router?.stack || [];
const routeLayers = stack.filter(
  (layer) => layer.route || layer.name === "router",
);

// eslint-disable-next-line no-console
console.log(`Loaded ${routeLayers.length} top-level route layers`);
process.exit(0);
