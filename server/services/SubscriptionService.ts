import { sharedStore as store } from '../store.js';
import { SubscriptionRequest, SubscriptionStatus } from '../../types.js';

export class SubscriptionService {

  async createSubscriptionRequest(requestData: Omit<SubscriptionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    const status = requestData.accessType === 'PHYSICAL' ? 'PENDING' : 'ACTIVE';
    const request = await store.createSubscriptionRequest({
      ...requestData,
      status
    });

    // Handle physical subscription user creation
    if (requestData.accessType === 'PHYSICAL') {
      await store.ensurePhysicalSubscriptionUser({
        email: requestData.email,
        name: requestData.name,
        status: 'PENDING'
      });
    }

    return request;
  }

  getSubscriptionRequests() {
    return store.listSubscriptionRequests();
  }

  async updateSubscriptionRequest(id: string, status: SubscriptionStatus) {
    const request = await store.updateSubscriptionRequest(id, status);
    if (!request) {
      throw new Error('Subscription request not found.');
    }

    // Update physical subscription status if applicable
    if (request.accessType === 'PHYSICAL') {
      await store.updatePhysicalSubscriptionStatus(request.email, status);
    }

    return request;
  }
}