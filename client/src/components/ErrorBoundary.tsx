import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackView?: () => void;
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
    console.error('ErrorBoundary atrapó un error no controlado:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#181A17] border border-red-500/30 shadow-2xl space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white">
                Algo no cargó correctamente
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                {this.state.error?.message || 'Error inesperado de renderizado.'}
              </p>
            </div>

            <div className="pt-2 flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.fallbackView) {
                    this.props.fallbackView();
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8E1D1] text-[#141513] text-xs font-bold shadow hover:bg-white transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Volver al Catálogo</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-stone-200 text-xs font-semibold hover:bg-white/15 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
