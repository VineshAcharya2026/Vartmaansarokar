import { sharedStore as store, UserRecord } from '../store.js';
import { SubscriptionRequest, SubscriptionStatus, UserRole } from '../../../vartmaan-shared-types.js';
import { AppError } from '../utils/errorHandler.js';
import { verifyRecaptchaToken } from '../utils/recaptcha.js';
import { sendTransactionalEmail } from '../utils/email.js';
import {
  validateEmail,
  validateMobile10,
  validatePhysicalAddress,
  validateSubscriberName
} from '../utils/subscriptionInput.js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export class SubscriptionService {
  private hasDigitalSubscriptionConflict(emailNormalized: string): boolean {
    const requests = store.listSubscriptionRequests();
    const conflictRequest = requests.some(
      (r) =>
        r.email.trim().toLowerCase() === emailNormalized &&
        r.accessType === 'DIGITAL' &&
        r.status !== 'REJECTED'
    );
    if (conflictRequest) return true;
    const user = store.findUserByEmail(emailNormalized);
    if (user && user.subscription_status === 'ACTIVE') return true;
    return false;
  }

  private hasPhysicalPendingConflict(emailNormalized: string): boolean {
    return store.listSubscriptionRequests().some(
      (r) =>
        r.email.trim().toLowerCase() === emailNormalized &&
        r.accessType === 'PHYSICAL' &&
        r.status === 'PENDING'
    );
  }

  async createSubscriptionRequest(requestData: Omit<SubscriptionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    return store.createSubscriptionRequest({
      ...requestData,
      status: 'PENDING'
    });
  }

  /**
   * Public digital signup: captcha, validation, no duplicate, create + immediate activation.
   */
  async registerDigitalFromPopup(input: {
    name: string;
    email: string;
    phone: string;
    message?: string;
    recaptchaToken?: string;
  }): Promise<SubscriptionRequest> {
    const captcha = await verifyRecaptchaToken(input.recaptchaToken);
    if (!captcha.ok) {
      throw new AppError(captcha.reason, 400);
    }

    const nameV = validateSubscriberName(input.name);
    if (!nameV.ok) throw new AppError(nameV.reason, 400);
    const emailV = validateEmail(input.email);
    if (!emailV.ok) throw new AppError(emailV.reason, 400);
    const phoneV = validateMobile10(input.phone);
    if (!phoneV.ok) throw new AppError(phoneV.reason, 400);

    if (this.hasDigitalSubscriptionConflict(emailV.value)) {
      throw new AppError('This email already has digital access or a pending request.', 409);
    }

    const message = (input.message ?? '').trim().slice(0, 2000) || undefined;

    const request = await this.createSubscriptionRequest({
      name: nameV.value,
      email: emailV.value,
      phone: phoneV.value,
      accessType: 'DIGITAL',
      resourceId: 'popup-digital',
      resourceTitle: 'Digital access (popup)',
      message,
      paymentScreenshotUrl: undefined,
      address: undefined
    });

    await this.approveAndActivateSubscriber(request.id, undefined);

    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    try {
      if (adminEmail) {
        await sendTransactionalEmail({
          to: adminEmail,
          subject: `[Vartmaan] Digital activation — ${nameV.value}`,
          text: `New digital subscriber (auto-activated): ${nameV.value} <${emailV.value}> ${phoneV.value}. Message: ${message ?? '(none)'}`
        });
      }
      await sendTransactionalEmail({
        to: emailV.value,
        subject: 'Welcome to Vartmaan Sarokaar — Digital access',
        text: `Hi ${nameV.value},\n\nWelcome to Vartmaan Sarokaar. Your digital access is active.\n\nYou can sign in with Google or request a password reset if you use email login.\n\n— Vartmaan Sarokaar`
      });
    } catch {
      /* email is best-effort; signup must still succeed */
    }

    return store.listSubscriptionRequests().find((r) => r.id === request.id) ?? request;
  }

  /**
   * Public physical signup: captcha, validation, screenshot URL, pending admin approval.
   */
  async registerPhysicalFromPopup(input: {
    name: string;
    email: string;
    phone: string;
    address: string;
    recaptchaToken?: string;
    paymentScreenshotUrl: string;
  }): Promise<SubscriptionRequest> {
    const captcha = await verifyRecaptchaToken(input.recaptchaToken);
    if (!captcha.ok) {
      throw new AppError(captcha.reason, 400);
    }

    const nameV = validateSubscriberName(input.name);
    if (!nameV.ok) throw new AppError(nameV.reason, 400);
    const emailV = validateEmail(input.email);
    if (!emailV.ok) throw new AppError(emailV.reason, 400);
    const phoneV = validateMobile10(input.phone);
    if (!phoneV.ok) throw new AppError(phoneV.reason, 400);
    const addrV = validatePhysicalAddress(input.address);
    if (!addrV.ok) throw new AppError(addrV.reason, 400);

    if (!input.paymentScreenshotUrl) {
      throw new AppError('Payment screenshot is required.', 400);
    }

    if (this.hasPhysicalPendingConflict(emailV.value)) {
      throw new AppError('A print subscription request is already pending for this email.', 409);
    }

    const request = await this.createSubscriptionRequest({
      name: nameV.value,
      email: emailV.value,
      phone: phoneV.value,
      accessType: 'PHYSICAL',
      resourceId: 'popup-print',
      resourceTitle: `Print — ${addrV.value.slice(0, 80)}`,
      message: undefined,
      paymentScreenshotUrl: input.paymentScreenshotUrl,
      address: addrV.value
    });

    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    try {
      if (adminEmail) {
        await sendTransactionalEmail({
          to: adminEmail,
          subject: `[Vartmaan] New print subscription — ${nameV.value}`,
          text: `New physical subscription request:\nName: ${nameV.value}\nEmail: ${emailV.value}\nPhone: ${phoneV.value}\nAddress: ${addrV.value}\nScreenshot: ${input.paymentScreenshotUrl}\nRequest ID: ${request.id}`
        });
      }
      await sendTransactionalEmail({
        to: emailV.value,
        subject: 'We received your print subscription request',
        text: `Hi ${nameV.value},\n\nThank you. We received your print subscription request and payment proof. Our team will verify and activate your account within 24 hours.\n\n— Vartmaan Sarokaar`
      });
    } catch {
      /* non-fatal */
    }

    return request;
  }

  getSubscriptionRequests() {
    return store.listSubscriptionRequests();
  }

  async updateSubscriptionRequest(id: string, status: SubscriptionStatus, reviewer?: UserRecord, rejectionReason?: string) {
    const reason = status === 'REJECTED' ? (rejectionReason?.trim() || undefined) : undefined;
    const request = await store.updateSubscriptionRequest(id, status, reviewer, reason);
    if (!request) throw new AppError('Subscription request not found.', 404);
    if (status === 'REJECTED' && reviewer) {
      await store.recordAudit({
        actor: reviewer,
        action: 'SUBSCRIBER_REJECTED',
        targetType: 'subscription_request',
        targetId: request.id,
        details: { email: request.email, accessType: request.accessType, reason: reason ?? null }
      });
    }
    return request;
  }

  async approveAndActivateSubscriber(id: string, reviewer?: UserRecord) {
    const request = await this.updateSubscriptionRequest(id, 'APPROVED', reviewer);
    const existingUser = store.findUserByEmail(request.email);
    const subscriptionPlan = request.accessType === 'PHYSICAL' ? 'PRINT' : 'DIGITAL';
    const paymentProof = request.paymentScreenshotUrl;

    if (existingUser) {
      await store.updateUser(existingUser.id, {
        name: request.name || existingUser.name,
        phone: request.phone || existingUser.phone,
        address: request.address || existingUser.address,
        role: existingUser.role === UserRole.READER ? UserRole.SUBSCRIBER : existingUser.role,
        subscription_plan: subscriptionPlan,
        subscription_status: 'ACTIVE',
        payment_proof: paymentProof || existingUser.payment_proof
      });
      return request;
    }

    await store.createUser({
      email: request.email,
      name: request.name || request.email.split('@')[0],
      role: UserRole.SUBSCRIBER,
      authProvider: 'PASSWORD',
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 10)
    });

    const createdUser = store.findUserByEmail(request.email);
    if (createdUser) {
      await store.updateUser(createdUser.id, {
        phone: request.phone,
        address: request.address,
        subscription_plan: subscriptionPlan,
        subscription_status: 'ACTIVE',
        payment_proof: paymentProof
      });
    }

    if (reviewer) {
      await store.recordAudit({
        actor: reviewer,
        action: 'SUBSCRIBER_APPROVED',
        targetType: 'subscription_request',
        targetId: request.id,
        details: { email: request.email, accessType: request.accessType }
      });
    }

    return request;
  }

  async deleteSubscriptionRequest(id: string) {
    const request = await store.deleteSubscriptionRequest(id);
    if (!request) throw new AppError('Subscription request not found.', 404);
    return request;
  }
}
