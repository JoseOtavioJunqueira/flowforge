import { randomBytes } from 'node:crypto';

let ephemeral: string | undefined;

// Single source of truth for the JWT secret.
// - JWT_SECRET set: always used.
// - Not set, development: a well-known fallback (local use only).
// - Not set, production: a random per-process secret. Tokens can never be
//   forged, they just stop being valid when the instance restarts, and a
//   warning is logged. This keeps the API up instead of crashing.
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== 'production') return 'dev-secret';
  if (!ephemeral) {
    ephemeral = randomBytes(32).toString('hex');
    console.warn(
      '[auth] JWT_SECRET is not set; using a temporary random secret. Set JWT_SECRET to persist sessions.',
    );
  }
  return ephemeral;
};
