import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Verify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification token.');
        return;
      }

      try {
        const BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.vartmaansarokaar.com';
        const res = await fetch(`${BASE.replace(/\/$/, '')}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const data = await res.json() as {
          success?: boolean;
          data?: { message?: string };
          message?: string;
          error?: string | null;
        };

        if (res.ok && data.success) {
          setStatus('success');
          const msg = data.data?.message ?? data.message ?? 'Verification successful!';
          setMessage(msg);
          toast.success('Email verified! You can now log in.');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setStatus('error');
          const errMsg = data.error || 'Verification failed.';
          setMessage(errMsg);
          toast.error(errMsg);
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error during verification.');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-12 rounded-2xl shadow-2xl text-center max-w-lg w-full border border-gray-100">
        <div className="w-20 h-20 bg-[#f8f0f0] rounded-full flex items-center justify-center mx-auto mb-8">
          {status === 'loading' && (
             <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin"></div>
          )}
          {status === 'success' && (
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          )}
          {status === 'error' && (
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
        </div>
        
        <h1 className="text-3xl font-bold serif mb-4 text-[#001f3f]">
          {status === 'loading' ? 'Verifying your email...' : 
           status === 'success' ? 'Verification Successful' : 'Verification Failed'}
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {status === 'loading' ? 'Please wait a moment while we confirm your digital access.' : message}
        </p>

        {status !== 'loading' && (
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-[#800000] text-white py-4 rounded-xl font-bold hover:bg-red-800 transition-all shadow-lg hover:shadow-red-900/20"
          >
            Return to Homepage
          </button>
        )}
      </div>
    </div>
  );
};

export default Verify;
