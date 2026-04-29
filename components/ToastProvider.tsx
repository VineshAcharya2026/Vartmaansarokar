import { Toaster } from 'react-hot-toast';

export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        className: '',
        duration: 5000,
        style: {
          background: '#363636',
          color: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        success: {
          duration: 3000,
          style: {
            background: '#059669', // Emerald 600
          },
        },
        error: {
          duration: 4000,
          style: {
            background: '#dc2626', // Red 600
          },
        },
      }}
    />
  );
};

export default ToastProvider;
