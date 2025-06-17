import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fhir-form-wrapper">
          <div className="fhir-form-wrapper-content">
            <div className="fhir-error">
              <h2>Something went wrong</h2>
              <p>An unexpected error occurred. Please try refreshing the page.</p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details>
                  <summary>Error Details</summary>
                  <pre>{this.state.error.message}</pre>
                  <pre>{this.state.error.stack}</pre>
                </details>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="fhir-btn fhir-btn-primary"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 