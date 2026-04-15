import { Request, Response } from 'express';
import { SubscriptionService } from '../services/SubscriptionService.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

const subscriptionService = new SubscriptionService();

export const createSubscriptionRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await subscriptionService.createSubscriptionRequest(req.body);
  res.status(201).json({ success: true, message: 'Subscription request submitted.', data: { requestId: request.id, request } });
});

export const createUnlockRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await subscriptionService.createSubscriptionRequest({
    ...req.body,
    resourceType: req.body.resourceType || 'MAGAZINE',
    resourceId: req.body.resourceId || req.body.magazineId,
    resourceTitle: req.body.resourceTitle || req.body.magazineTitle
  });

  res.status(201).json({ success: true, message: 'Unlock request submitted.', data: { requestId: request.id, request } });
});

export const getSubscriptionRequests = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const requests = subscriptionService.getSubscriptionRequests();
  res.json({ success: true, message: 'Subscription requests loaded.', data: { requests } });
});

export const approveSubscriptionRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = await subscriptionService.updateSubscriptionRequest(req.params.id as string, 'APPROVED', req.user);
  res.json({ success: true, message: 'Subscriber approved.', data: { request } });
});

export const rejectSubscriptionRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = await subscriptionService.updateSubscriptionRequest(req.params.id as string, 'REJECTED', req.user);
  res.json({ success: true, message: 'Subscriber rejected.', data: { request } });
});

export const deleteSubscriptionRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = await subscriptionService.deleteSubscriptionRequest(req.params.id as string);
  res.json({ success: true, message: 'Subscriber deleted.', data: { requestId: request.id } });
});
