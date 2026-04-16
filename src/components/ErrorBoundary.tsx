import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-8">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
            <h2 className="text-2xl font-bold mb-4">System Interruption</h2>
            <p className="text-white/40 mb-6 text-sm">
              The infrastructure protocol encountered an unexpected error. 
              {this.state.error?.message && (
                <code className="block mt-2 p-2 bg-black/40 rounded text-red-400 text-xs break-all">
                  {this.state.error.message}
                </code>
              )}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all"
            >
              Restart Protocol
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
