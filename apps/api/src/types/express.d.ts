/**
 * Extends the Express Request interface with a typed `user` property.
 * This eliminates all `(req as any).user` casts across the API layer,
 * providing full TypeScript safety for the authenticated user context.
 *
 * The shape mirrors the JWT payload emitted by generateAccessToken/generateRefreshToken.
 */
import { JwtPayload } from './auth-types';

declare global {
  namespace Express {
    interface Request {
      /** Injected by the protectUser middleware after JWT verification. */
      user?: JwtPayload;
    }
  }
}
