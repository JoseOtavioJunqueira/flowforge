// Single source of truth for the JWT secret.
// A fallback is only allowed outside production, so a deployed instance can
// never silently sign tokens with a publicly known key.
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return 'dev-secret';
};
