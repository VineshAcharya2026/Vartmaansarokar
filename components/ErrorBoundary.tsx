import React from 'react';
import { APP_BASE } from '../utils/app';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
          <img src={`${APP_BASE}logo.png`} alt="Vartmaan Sarokaar" className="h-12 w-12 mx-auto mb-5 rounded-lg border border-gray-200 p-1" />
          <h1 className="text-2xl font-bold text-[#001f3f] mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-sm mb-6">
            An unexpected error occurred. Please try reloading the page.
          </p>
          {this.state.error && (
            <pre className="mb-6 rounded-lg bg-gray-100 border border-gray-200 p-3 text-left text-xs text-gray-600 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleGoHome}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#001f3f] hover:bg-gray-50 transition-colors"
            >
              Go Home
            </button>
            <button
              onClick={this.handleReload}
              className="rounded-lg bg-[#001f3f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#002b57] transition-colors shadow-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
