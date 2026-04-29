import { SubscriptionService } from '../services/SubscriptionService.js';
import { asyncHandler } from '../utils/errorHandler.js';
const subscriptionService = new SubscriptionService();
export const createSubscriptionRequest = asyncHandler(async (req, res) => {
    const request = await subscriptionService.createSubscriptionRequest(req.body);
    res.status(201).json({ success: true, message: 'Subscription request submitted.', data: { requestId: request.id, request } });
});
export const createUnlockRequest = asyncHandler(async (req, res) => {
    const request = await subscriptionService.createSubscriptionRequest({
        ...req.body,
        resourceType: req.body.resourceType || 'MAGAZINE',
        resourceId: req.body.resourceId || req.body.magazineId,
        resourceTitle: req.body.resourceTitle || req.body.magazineTitle
    });
    res.status(201).json({ success: true, message: 'Unlock request submitted.', data: { requestId: request.id, request } });
});
export const getSubscriptionRequests = asyncHandler(async (_req, res) => {
    const requests = subscriptionService.getSubscriptionRequests();
    res.json({ success: true, message: 'Subscription requests loaded.', data: { requests } });
});
export const approveSubscriptionRequest = asyncHandler(async (req, res) => {
    const request = await subscriptionService.updateSubscriptionRequest(req.params.id, 'APPROVED', req.user);
    res.json({ success: true, message: 'Subscriber approved.', data: { request } });
});
export const rejectSubscriptionRequest = asyncHandler(async (req, res) => {
    const request = await subscriptionService.updateSubscriptionRequest(req.params.id, 'REJECTED', req.user);
    res.json({ success: true, message: 'Subscriber rejected.', data: { request } });
});
export const deleteSubscriptionRequest = asyncHandler(async (req, res) => {
    const request = await subscriptionService.deleteSubscriptionRequest(req.params.id);
    res.json({ success: true, message: 'Subscriber deleted.', data: { requestId: request.id } });
});
