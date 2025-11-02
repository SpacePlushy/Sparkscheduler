import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { validate, schemas } from '../middleware/validation';

const router = express.Router();

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validate(schemas.register), async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, city, state, timezone } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: 'User with this email already exists',
        },
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      primary_city: city,
      primary_state: state,
      timezone: timezone || 'America/Phoenix',
      account_status: 'active',
      email_verified: false,
      subscription_tier: 'free',
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tier: user.subscription_tier,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRY || '24h',
      }
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
        expiresAt,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed',
      },
    });
  }
});

/**
 * @route POST /auth/login
 * @desc Authenticate user and return token
 * @access Public
 */
router.post('/login', validate(schemas.login), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Invalid credentials',
        },
      });
    }

    // Check account status
    if (user.account_status !== 'active') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Account is suspended or deleted',
        },
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Invalid credentials',
        },
      });
    }

    // Update last login
    await user.update({ last_login_at: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tier: user.subscription_tier,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRY || '24h',
      }
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
        expiresAt,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed',
      },
    });
  }
});

/**
 * @route POST /auth/refresh
 * @desc Refresh JWT token
 * @access Public (with valid token)
 */
router.post('/refresh', async (req: Request, res: Response) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      ignoreExpiration: true, // Allow expired tokens for refresh
    }) as { sub: string; email: string; tier: string };

    // Verify user still exists
    const user = await User.findByPk(decoded.sub);
    if (!user || user.account_status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Invalid token',
        },
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        tier: user.subscription_tier,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRY || '24h',
      }
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return res.status(200).json({
      success: true,
      data: {
        token: newToken,
        expiresAt,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token refresh failed',
      },
    });
  }
});

export default router;
