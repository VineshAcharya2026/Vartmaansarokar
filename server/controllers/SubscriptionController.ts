import { Request, Response } from 'express';
import { SubscriptionService } from '../services/SubscriptionService.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { SubscriptionStatus } from '../../types.js';

const subscriptionService = new SubscriptionService();

export const createSubscriptionRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await subscriptionService.createSubscriptionRequest(req.body);

  res.status(201).json({
    success: true,
    message: 'Subscription request submitted.',
    data: { requestId: request.id, request }
  });
});

export const createUnlockRequest = asyncHandler(async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    resourceType: req.body.resourceType || 'MAGAZINE',
    resourceId: req.body.resourceId || req.body.magazineId,
    resourceTitle: req.body.resourceTitle || req.body.magazineTitle
  };

  const request = await subscriptionService.createSubscriptionRequest(payload);

  res.status(201).json({
    success: true,
    message: 'Unlock request submitted.',
    data: { requestId: request.id, request }
  });
});

export const getSubscriptionRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const requests = subscriptionService.getSubscriptionRequests();

  res.json({
    success: true,
    message: 'Subscription requests loaded.',
    data: { requests }
  });
});

export const updateSubscriptionRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['ACTIVE', 'EXPIRED', 'PENDING'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subscription status.',
      error: 'Invalid status value'
    });
  }

  const request = await subscriptionService.updateSubscriptionRequest(id as string, status);

  res.json({
    success: true,
    message: 'Subscription request updated.',
    data: { request }
  });
});