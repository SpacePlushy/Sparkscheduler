import express, { Response } from 'express';
import User from '../models/User';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = express.Router();

/**
 * @route GET /users/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: user.toJSON(),
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve user',
      },
    });
  }
});

/**
 * @route PATCH /users/me
 * @desc Update current user profile
 * @access Private
 */
router.patch(
  '/me',
  authenticateJWT,
  validate(schemas.updateProfile),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findByPk(req.user!.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      const { firstName, lastName, phoneNumber, primaryCity, primaryState, timezone } = req.body;

      await user.update({
        first_name: firstName !== undefined ? firstName : user.first_name,
        last_name: lastName !== undefined ? lastName : user.last_name,
        phone_number: phoneNumber !== undefined ? phoneNumber : user.phone_number,
        primary_city: primaryCity !== undefined ? primaryCity : user.primary_city,
        primary_state: primaryState !== undefined ? primaryState : user.primary_state,
        timezone: timezone !== undefined ? timezone : user.timezone,
      });

      return res.status(200).json({
        success: true,
        data: user.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user',
        },
      });
    }
  }
);

/**
 * @route DELETE /users/me
 * @desc Delete user account
 * @access Private
 */
router.delete('/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Soft delete - mark for deletion in 30 days
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await user.update({
      account_status: 'deleted',
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Account scheduled for deletion in 30 days',
        deletionDate,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete user',
      },
    });
  }
});

export default router;
