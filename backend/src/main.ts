// No top-level imports of @nestjs/* here on purpose: on Vercel node_modules is
// not shipped with the function, so we load the self-contained bundle built by
// `npm run bundle` instead. Locally we bootstrap from source.
if (process.env.VERCEL) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../bundle/server.cjs');
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { bootstrap } = require('./bootstrap') as typeof import('./bootstrap');
  void bootstrap();
}
