import express, { Response } from 'express';
import { Op } from 'sequelize';
import Trip from '../models/Trip';
import Zone from '../models/Zone';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { CacheService } from '../config/redis';

const router = express.Router();

/**
 * @route GET /earnings/trips
 * @desc Get trip history for current user
 * @access Private
 */
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      from,
      to,
      zoneId,
      page = '1',
      pageSize = '20',
    } = req.query;

    // Build where clause
    const where: any = { user_id: userId };

    if (from || to) {
      where.trip_date = {};
      if (from) where.trip_date[Op.gte] = from;
      if (to) where.trip_date[Op.lte] = to;
    }

    if (zoneId) {
      where.zone_id = zoneId;
    }

    // Pagination
    const limit = Math.min(parseInt(pageSize as string), 100);
    const offset = (parseInt(page as string) - 1) * limit;

    // Get trips
    const { count, rows: trips } = await Trip.findAndCountAll({
      where,
      limit,
      offset,
      order: [['trip_date', 'DESC'], ['start_time', 'DESC']],
      include: [
        {
          model: Zone,
          as: 'zone',
          attributes: ['id', 'zone_name'],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: trips,
      pagination: {
        page: parseInt(page as string),
        pageSize: limit,
        totalItems: count,
        totalPages,
        hasNext: parseInt(page as string) < totalPages,
        hasPrev: parseInt(page as string) > 1,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get trips error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve trips',
      },
    });
  }
});

/**
 * @route POST /earnings/trips
 * @desc Create a new trip
 * @access Private
 */
router.post(
  '/',
  authenticateJWT,
  validate(schemas.createTrip),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const trip = await Trip.create({
        user_id: userId,
        ...req.body,
        data_source: 'manual',
      });

      // Invalidate user cache
      await CacheService.delPattern(`trips:${userId}:*`);
      await CacheService.delPattern(`earnings:${userId}:*`);

      return res.status(201).json({
        success: true,
        data: trip,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Create trip error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create trip',
        },
      });
    }
  }
);

/**
 * @route GET /earnings/trips/:id
 * @desc Get specific trip
 * @access Private
 */
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const trip = await Trip.findOne({
      where: {
        id,
        user_id: userId,
      },
      include: [
        {
          model: Zone,
          as: 'zone',
        },
      ],
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Trip not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: trip,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get trip error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve trip',
      },
    });
  }
});

/**
 * @route DELETE /earnings/trips/:id
 * @desc Delete a trip
 * @access Private
 */
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const trip = await Trip.findOne({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Trip not found',
        },
      });
    }

    await trip.destroy();

    // Invalidate cache
    await CacheService.delPattern(`trips:${userId}:*`);
    await CacheService.delPattern(`earnings:${userId}:*`);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Trip deleted successfully',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete trip',
      },
    });
  }
});

/**
 * @route GET /earnings/summary
 * @desc Get earnings summary
 * @access Private
 */
router.get('/summary', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { from, to, zoneId } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'from and to parameters are required',
        },
      });
    }

    // Check cache
    const cacheKey = `earnings:summary:${userId}:${from}:${to}:${zoneId || 'all'}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        meta: {
          timestamp: new Date().toISOString(),
          cached: true,
        },
      });
    }

    const where: any = {
      user_id: userId,
      trip_date: {
        [Op.gte]: from,
        [Op.lte]: to,
      },
    };

    if (zoneId) {
      where.zone_id = zoneId;
    }

    const trips = await Trip.findAll({ where });

    const summary = {
      totalEarnings: trips.reduce((sum, t) => sum + parseFloat(t.total_earnings.toString()), 0),
      totalTrips: trips.length,
      totalHours: trips.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / 60,
      totalMiles: trips.reduce((sum, t) => sum + parseFloat(t.distance_miles?.toString() || '0'), 0),
      avgEarningsPerHour: 0,
      avgEarningsPerTrip: 0,
      avgEarningsPerMile: 0,
      breakdown: {
        basePay: trips.reduce((sum, t) => sum + parseFloat(t.base_pay.toString()), 0),
        tips: trips.reduce((sum, t) => sum + parseFloat(t.tip_amount.toString()), 0),
        incentives: trips.reduce((sum, t) => sum + parseFloat(t.incentive_amount.toString()), 0),
      },
    };

    // Calculate averages
    if (summary.totalHours > 0) {
      summary.avgEarningsPerHour = summary.totalEarnings / summary.totalHours;
    }
    if (summary.totalTrips > 0) {
      summary.avgEarningsPerTrip = summary.totalEarnings / summary.totalTrips;
    }
    if (summary.totalMiles > 0) {
      summary.avgEarningsPerMile = summary.totalEarnings / summary.totalMiles;
    }

    // Cache for 1 hour
    await CacheService.set(cacheKey, summary, 3600);

    return res.status(200).json({
      success: true,
      data: summary,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get summary error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve summary',
      },
    });
  }
});

export default router;
