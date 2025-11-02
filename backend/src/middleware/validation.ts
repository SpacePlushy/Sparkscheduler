import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        },
      });
    }

    req.body = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        'string.pattern.base':
          'Password must contain uppercase, lowercase, number, and special character',
      }),
    firstName: Joi.string().max(100).optional(),
    lastName: Joi.string().max(100).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().length(2).uppercase().optional(),
    timezone: Joi.string().max(50).default('America/Phoenix'),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createTrip: Joi.object({
    zoneId: Joi.string().uuid().optional(),
    tripDate: Joi.date().max('now').required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().min(Joi.ref('startTime')).optional(),
    tripType: Joi.string()
      .valid('delivery', 'shop_and_deliver', 'express', 'dotcom')
      .default('delivery'),
    orderCount: Joi.number().integer().min(1).max(10).default(1),
    pickupAddress: Joi.string().max(255).optional(),
    dropoffAddress: Joi.string().max(255).optional(),
    distanceMiles: Joi.number().min(0).max(200).optional(),
    basePay: Joi.number().min(0).max(500).required(),
    tipAmount: Joi.number().min(0).max(200).default(0),
    incentiveAmount: Joi.number().min(0).max(200).default(0),
    notes: Joi.string().max(1000).optional(),
  }),

  createZone: Joi.object({
    zoneName: Joi.string().max(100).required(),
    zoneType: Joi.string().max(50).default('walmart_store'),
    storeId: Joi.string().max(50).optional(),
    address: Joi.string().max(255).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().length(2).uppercase().optional(),
    zipCode: Joi.string().max(10).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    radiusMiles: Joi.number().min(1).max(50).default(10),
    isPrimary: Joi.boolean().default(false),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().max(100).optional(),
    lastName: Joi.string().max(100).optional(),
    phoneNumber: Joi.string().max(20).optional(),
    primaryCity: Joi.string().max(100).optional(),
    primaryState: Joi.string().length(2).uppercase().optional(),
    timezone: Joi.string().max(50).optional(),
  }),
};
