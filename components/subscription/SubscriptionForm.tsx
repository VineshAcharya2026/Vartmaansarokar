import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, CreditCard, Smartphone } from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../utils/app';

interface SubscriptionFormProps {
  userId?: string;
  onSuccess?: () => void;
}

const PLANS = [
  { id: 'monthly', name: 'Monthly Digital', price: 99, period: 'month' },
  { id: 'quarterly', name: 'Quarterly Digital', price: 249, period: '3 months' },
  { id: 'yearly', name: 'Yearly Digital', price: 799, period: 'year', popular: true },
  { id: 'physical', name: 'Physical Magazine', price: 499, period: 'year' }
];

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  userId,
  onSuccess
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setScreenshot(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlan) {
      setError('Please select a plan');
      return;
    }
    if (!screenshot) {
      setError('Please upload payment screenshot');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Step 1: Upload screenshot
      setUploading(true);
      const formData = new FormData();
      formData.append('file', screenshot);

      const uploadResponse = await fetch(`${API_BASE}/api/uploads`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload screenshot');
      }

      const uploadData = await uploadResponse.json();
      const screenshotUrl = uploadData.data?.media?.url;
      setUploading(false);

      // Step 2: Create subscription
      const plan = PLANS.find(p => p.id === selectedPlan);
      const subscriptionResponse = await fetch(`${API_BASE}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          userId: userId || 'guest',
          plan: plan?.name,
          amount: plan?.price,
          paymentMethod: 'UPI',
          paymentScreenshotUrl: screenshotUrl
        })
      });

      if (!subscriptionResponse.ok) {
        throw new Error('Failed to submit subscription');
      }

      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-emerald-800 mb-2">Submitted Successfully!</h3>
        <p className="text-emerald-600">
          We will verify your payment within 24 hours. You will receive an email confirmation once verified.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-black text-[#001f3f] mb-6 text-center">Subscribe to Vartmaan Sarokar</h2>

      {/* Step 1: Choose Plan */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#800000] text-white flex items-center justify-center text-sm">1</span>
          Choose Your Plan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                selectedPlan === plan.id
                  ? 'border-[#800000] bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">{plan.name}</span>
                {plan.popular && (
                  <span className="bg-[#800000] text-white text-xs px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-[#001f3f]">
                ₹{plan.price}
                <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Payment Instructions */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#800000] text-white flex items-center justify-center text-sm">2</span>
          Make Payment
        </h3>
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#800000] rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Pay via UPI</p>
              <p className="text-gray-600">vineshjm@upi</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#001f3f] rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Bank Transfer</p>
              <p className="text-sm text-gray-600">Account: 1234567890 | IFSC: SBIN0001234</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Upload Screenshot */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#800000] text-white flex items-center justify-center text-sm">3</span>
          Upload Payment Screenshot
        </h3>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            screenshot ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {screenshot ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{screenshot.name}</span>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Click to upload payment screenshot</p>
              <p className="text-sm text-gray-400 mt-1">JPG, PNG up to 5MB</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || uploading}
        className="w-full bg-[#800000] text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Submitting...' : uploading ? 'Uploading...' : 'Submit Subscription'}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        Your subscription will be activated within 24 hours after verification.
      </p>
    </div>
  );
};

export default SubscriptionForm;
