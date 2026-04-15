import { sharedStore as store, UserRecord } from '../store.js';
import { SubscriptionRequest, SubscriptionStatus } from '../../types.js';
import { AppError } from '../utils/errorHandler.js';

export class SubscriptionService {
  async createSubscriptionRequest(requestData: Omit<SubscriptionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    return store.createSubscriptionRequest({
      ...requestData,
      status: 'PENDING'
    });
  }

  getSubscriptionRequests() {
    return store.listSubscriptionRequests();
  }

  async updateSubscriptionRequest(id: string, status: SubscriptionStatus, reviewer?: UserRecord) {
    const request = await store.updateSubscriptionRequest(id, status, reviewer);
    if (!request) throw new AppError('Subscription request not found.', 404);
    return request;
  }

  async deleteSubscriptionRequest(id: string) {
    const request = await store.deleteSubscriptionRequest(id);
    if (!request) throw new AppError('Subscription request not found.', 404);
    return request;
  }
}
