export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  lastAttempt: number;
}

const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error: any) => {
    // Retry on network errors, 5xx server errors, and rate limiting
    if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
    if (error.status >= 500 && error.status < 600) return true;
    if (error.status === 429) return true;
    return false;
  }
};

// Calculate delay with exponential backoff
function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main retry function
export async function retry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const config = { ...defaultOptions, ...options };
  let lastError: any;
  let lastAttempt = 0;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts: attempt,
        lastAttempt: Date.now()
      };
    } catch (error) {
      lastError = error;
      lastAttempt = attempt;

      // Check if we should retry
      if (attempt === config.maxAttempts || !config.retryCondition!(error)) {
        break;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: lastAttempt,
    lastAttempt: Date.now()
  };
}

// Retry with user confirmation
export async function retryWithConfirmation<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  onRetryPrompt: (error: any, attempt: number, maxAttempts: number) => Promise<boolean>
): Promise<RetryResult<T>> {
  const config = { ...defaultOptions, ...options };
  let lastError: any;
  let lastAttempt = 0;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts: attempt,
        lastAttempt: Date.now()
      };
    } catch (error) {
      lastError = error;
      lastAttempt = attempt;

      // Check if we should retry
      if (attempt === config.maxAttempts || !config.retryCondition!(error)) {
        break;
      }

      // Ask user if they want to retry
      const shouldRetry = await onRetryPrompt(error, attempt, config.maxAttempts);
      if (!shouldRetry) {
        break;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: lastAttempt,
    lastAttempt: Date.now()
  };
}

// Create a retryable operation with automatic retry
export function createRetryableOperation<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
) {
  return () => retry(operation, options);
}

// Create a retryable operation with user confirmation
export function createRetryableOperationWithConfirmation<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  onRetryPrompt: (error: any, attempt: number, maxAttempts: number) => Promise<boolean>
) {
  return () => retryWithConfirmation(operation, options, onRetryPrompt);
}

// Error message helpers
export function getRetryErrorMessage(error: any, attempt: number, maxAttempts: number): string {
  if (attempt >= maxAttempts) {
    return `Operation failed after ${maxAttempts} attempts. Please try again later.`;
  }

  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (error.status >= 500) {
    return 'Server error occurred. Please try again.';
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  return `Operation failed. Attempt ${attempt} of ${maxAttempts}.`;
}

// Retry configuration presets
export const retryPresets = {
  network: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2
  },
  server: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 2
  },
  critical: {
    maxAttempts: 10,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 1.5
  }
}; 