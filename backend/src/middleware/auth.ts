import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    tier: string;
  };
}

export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'No token provided',
        },
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      email: string;
      tier: string;
    };

    // Check if user still exists and is active
    const user = await User.findByPk(decoded.sub);
    if (!user || user.account_status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Invalid or expired token',
        },
      });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      tier: decoded.tier,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token is invalid or expired',
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
      },
    });
  }
};

export const requirePermission = (permission: string) => {
  const permissions: Record<string, string[]> = {
    free: [
      'trips:read',
      'trips:create',
      'zones:read',
      'zones:create',
      'profile:read',
      'profile:update',
    ],
    pro: [
      'trips:read',
      'trips:create',
      'zones:read',
      'zones:create',
      'profile:read',
      'profile:update',
      'schedule:predict',
      'schedule:export',
      'analytics:advanced',
      'incentives:track',
      'notifications:advanced',
    ],
  };

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      });
    }

    const userPermissions = permissions[req.user.tier] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_TIER',
          message: `This feature requires a Pro subscription`,
          requiredTier: 'pro',
          currentTier: req.user.tier,
        },
      });
    }

    next();
  };
};
