// Vercel Node function. The backend is pre-bundled (npm run bundle in /backend)
// so the function needs no node_modules.
const mod = require('../backend/bundle/handler.cjs');
module.exports = mod.default || mod;
