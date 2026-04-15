import { sharedStore as store } from '../store.js';
import { AppError } from '../utils/errorHandler.js';
export class SubscriptionService {
    async createSubscriptionRequest(requestData) {
        return store.createSubscriptionRequest({
            ...requestData,
            status: 'PENDING'
        });
    }
    getSubscriptionRequests() {
        return store.listSubscriptionRequests();
    }
    async updateSubscriptionRequest(id, status, reviewer) {
        const request = await store.updateSubscriptionRequest(id, status, reviewer);
        if (!request)
            throw new AppError('Subscription request not found.', 404);
        return request;
    }
    async deleteSubscriptionRequest(id) {
        const request = await store.deleteSubscriptionRequest(id);
        if (!request)
            throw new AppError('Subscription request not found.', 404);
        return request;
    }
}
