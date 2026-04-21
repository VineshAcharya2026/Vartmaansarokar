import { Request, Response } from 'express';
import { SubscriptionService } from '../services/SubscriptionService.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

const subscriptionService = new SubscriptionService();

/** POST /api/subscriptions — multipart (Subscribe page) or used after upload */
export const createPublicSubscription = asyncHandler(async (req: Request, res: Response) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim();
  const phone = String(req.body?.phone ?? '').trim();
  const plan = String(req.body?.plan ?? 'DIGITAL').toUpperCase();
  const address = String(req.body?.address ?? '').trim();
  const screenshotPath = req.file ? `/uploads/${req.file.filename}` : '';

  if (!name || !email || !phone) {
    throw new AppError('Name, email, and phone are required.', 400);
  }
  const physical = plan === 'PRINT' || plan === 'PHYSICAL';
  if (physical && !screenshotPath) {
    throw new AppError('Payment screenshot is required for print plans.', 400);
  }

  await subscriptionService.createSubscriptionRequest({
    name,
    email,
    phone,
    accessType: physical ? 'PHYSICAL' : 'DIGITAL',
    resourceId: 'website',
    resourceTitle: address ? `${plan} — ${address}` : `${plan} subscription`,
    paymentScreenshotUrl: screenshotPath || undefined
  } as any);

  res.status(201).json({ success: true, message: 'Subscription request submitted.' });
});

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
