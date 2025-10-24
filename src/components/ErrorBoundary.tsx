'use client';

// src/components/ErrorBoundary.tsx
// Error boundary component following React best practices

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LoggerFactory } from '@/src/services/logging/ILogger';
import { AppError, ErrorContext } from '@/src/services/errors/ErrorTypes';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error?: AppError;
}

export class ErrorBoundary extends Component<Props, State> {
  private logger = LoggerFactory.getLogger();

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const context: ErrorContext = {
      operation: 'error_boundary',
      timestamp: new Date(),
    };

    const appError: AppError = {
      message: error.message || 'An unexpected error occurred',
      code: 'ERROR_BOUNDARY',
      context,
      originalError: error,
    };

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const context: ErrorContext = {
      operation: 'error_boundary_catch',
      timestamp: new Date(),
      additionalData: {
        componentStack: errorInfo.componentStack,
      },
    };

    const appError: AppError = {
      message: error.message || 'An unexpected error occurred',
      code: 'ERROR_BOUNDARY_CATCH',
      context,
      originalError: error,
    };

    this.logger.error('Error boundary caught an error', error, {
      context: {
        operation: 'error_boundary',
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({ error: appError });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details</summary>
            <p><strong>Message:</strong> {this.state.error?.message}</p>
            <p><strong>Code:</strong> {this.state.error?.code}</p>
            <p><strong>Timestamp:</strong> {this.state.error?.context.timestamp.toISOString() || 'Unknown'}</p>
            {this.state.error?.originalError ? (
              <p><strong>Original Error:</strong> {this.state.error.originalError instanceof Error ? this.state.error.originalError.message : 'Unknown error'}</p>
            ) : null}
          </details>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
