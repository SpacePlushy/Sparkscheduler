import express, { Response } from 'express';
import Zone from '../models/Zone';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = express.Router();

/**
 * @route GET /zones
 * @desc Get all zones for current user
 * @access Private
 */
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { active } = req.query;

    const where: any = { user_id: userId };

    if (active !== undefined) {
      where.is_active = active === 'true';
    }

    const zones = await Zone.findAll({
      where,
      order: [
        ['is_primary', 'DESC'],
        ['created_at', 'ASC'],
      ],
    });

    return res.status(200).json({
      success: true,
      data: zones,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get zones error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve zones',
      },
    });
  }
});

/**
 * @route POST /zones
 * @desc Create a new zone
 * @access Private
 */
router.post(
  '/',
  authenticateJWT,
  validate(schemas.createZone),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Check for duplicate zone name
      const existing = await Zone.findOne({
        where: {
          user_id: userId,
          zone_name: req.body.zoneName,
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_RESOURCE',
            message: 'Zone with this name already exists',
          },
        });
      }

      const zone = await Zone.create({
        user_id: userId,
        zone_name: req.body.zoneName,
        zone_type: req.body.zoneType,
        store_id: req.body.storeId,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zip_code: req.body.zipCode,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        radius_miles: req.body.radiusMiles,
        is_primary: req.body.isPrimary,
        is_active: true,
      });

      return res.status(201).json({
        success: true,
        data: zone,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Create zone error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create zone',
        },
      });
    }
  }
);

/**
 * @route GET /zones/:id
 * @desc Get specific zone
 * @access Private
 */
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const zone = await Zone.findOne({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Zone not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: zone,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get zone error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve zone',
      },
    });
  }
});

/**
 * @route PATCH /zones/:id
 * @desc Update zone
 * @access Private
 */
router.patch('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const zone = await Zone.findOne({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Zone not found',
        },
      });
    }

    await zone.update(req.body);

    return res.status(200).json({
      success: true,
      data: zone,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Update zone error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update zone',
      },
    });
  }
});

/**
 * @route DELETE /zones/:id
 * @desc Delete zone
 * @access Private
 */
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const zone = await Zone.findOne({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Zone not found',
        },
      });
    }

    await zone.destroy();

    return res.status(200).json({
      success: true,
      data: {
        message: 'Zone deleted successfully',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Delete zone error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete zone',
      },
    });
  }
});

export default router;
