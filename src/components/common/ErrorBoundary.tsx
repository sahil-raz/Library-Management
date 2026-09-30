import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-900 px-6 py-12 text-white">
          <div className="w-full max-w-sm rounded-3xl bg-slate-800/90 p-6 text-center shadow-2xl backdrop-blur-xl border border-slate-700/60">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
              <AlertCircle size={32} />
            </div>

            <h2 className="text-lg font-bold tracking-tight text-white mb-1.5">
              Something went wrong
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              An unexpected issue occurred while rendering this view. You can reload the page or return to the main dashboard.
            </p>

            {this.state.error?.message && (
              <div className="mb-5 rounded-xl bg-slate-950/60 p-3 text-left border border-slate-800">
                <p className="text-[11px] font-mono text-rose-300 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-600 py-3 text-xs font-semibold text-white transition-all active:scale-[0.98] hover:bg-blue-500 shadow-md shadow-blue-600/20"
              >
                <RotateCcw size={15} />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-700/60 py-3 text-xs font-semibold text-slate-200 transition-all active:scale-[0.98] hover:bg-slate-700 hover:text-white"
              >
                <Home size={15} />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
