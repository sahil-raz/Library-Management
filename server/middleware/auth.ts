import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { validateSession } from '../services/sessionService.js';

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication token missing or invalid',
    });
    return;
  }

  const incomingDeviceId = (req.headers['x-device-id'] as string) || undefined;
  const incomingUserAgent = req.get('user-agent') || undefined;

  const result = await validateSession(token, incomingDeviceId, incomingUserAgent);

  if (!result.valid || !result.user) {
    res.status(401).json({
      success: false,
      code: result.code || 'TOKEN_EXPIRED_OR_INVALID',
      message: result.message || 'Session has expired or is invalid. Please log in again.',
    });
    return;
  }

  req.user = result.user;
  (req as any).sessionId = result.session?._id.toString();
  next();
}
