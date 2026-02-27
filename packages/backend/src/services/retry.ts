export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
  backoffMultiplier?: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
}

export class RetryManager {
  private readonly defaultConfig: Required<RetryConfig> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 60000,
    jitter: true,
    backoffMultiplier: 2,
  };

  constructor(customConfig?: Partial<RetryConfig>) {
    if (customConfig) {
      this.defaultConfig = { ...this.defaultConfig, ...customConfig } as Required<RetryConfig>;
    }
  }

  /**
   * Execute an operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error | undefined;
    let totalDelay = 0;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        const data = await operation();
        return {
          success: true,
          data,
          attempts: attempt,
          totalDelay,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry certain errors
        if (this.isNonRetryable(error as Error)) {
          return {
            success: false,
            error: lastError,
            attempts: attempt,
            totalDelay,
          };
        }

        // Check if we should retry
        if (attempt === finalConfig.maxAttempts) {
          return {
            success: false,
            error: lastError,
            attempts: attempt,
            totalDelay,
          };
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt, finalConfig);
        totalDelay += delay;
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: finalConfig.maxAttempts,
      totalDelay,
    };
  }

  /**
   * Check if an error is non-retryable
   */
  private isNonRetryable(error: Error): boolean {
    const message = error.message.toLowerCase();

    // HTTP status codes that should not be retried
    const nonRetryableStatuses = [400, 403, 404, 410, 411, 413, 414, 415];
    for (const status of nonRetryableStatuses) {
      if (message.includes(`status ${status}`) || message.includes(`${status} gone`)) {
        return true;
      }
    }

    // Specific error patterns
    const nonRetryablePatterns = [
      'invalid',
      'malformed',
      'unauthorized',
      'forbidden',
      'not found',
      'gone', // 410 Gone - subscription expired
      'permission denied',
      'authentication failed',
    ];

    for (const pattern of nonRetryablePatterns) {
      if (message.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, config: Required<RetryConfig>): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ (attempt - 1))
    const exponentialDelay = Math.min(
      config.baseDelay * config.backoffMultiplier! ** (attempt - 1),
      config.maxDelay
    );

    if (config.jitter) {
      // Add jitter: random value between 50% and 100% of calculated delay
      return exponentialDelay * (0.5 + Math.random() * 0.5);
    }

    return exponentialDelay;
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate next retry time for a given attempt
   */
  getNextRetryTime(attempt: number, now: Date = new Date()): Date {
    const delay = this.calculateDelay(attempt, this.defaultConfig);
    return new Date(now.getTime() + delay);
  }

  /**
   * Check if a retry is still possible
   */
  canRetry(attempt: number): boolean {
    return attempt < this.defaultConfig.maxAttempts;
  }
}

/**
 * Default retry manager instance
 */
export const retryManager = new RetryManager();

/**
 * Convenience function to execute with retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const result = await retryManager.withRetry(operation, config);
  if (result.success) {
    return result.data!;
  }
  throw result.error;
}

/**
 * Extract error code from error message
 */
export function extractErrorCode(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes('410') || message.includes('gone')) return 'EXPIRED';
  if (message.includes('403') || message.includes('forbidden')) return 'PERMISSION_DENIED';
  if (message.includes('404') || message.includes('not found')) return 'NOT_FOUND';
  if (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  )
    return 'RATE_LIMITED';
  if (message.includes('timeout') || message.includes('timed out')) return 'TIMEOUT';
  if (message.includes('network') || message.includes('econnrefused')) return 'NETWORK';
  if (message.includes('400') || message.includes('invalid') || message.includes('malformed'))
    return 'INVALID_PAYLOAD';
  if (message.includes('413') || message.includes('payload too large')) return 'PAYLOAD_TOO_LARGE';
  if (message.includes('500') || message.includes('internal')) return 'SERVER_ERROR';
  if (message.includes('503') || message.includes('unavailable')) return 'SERVICE_UNAVAILABLE';

  return 'UNKNOWN';
}

/**
 * Get retry config based on error code
 */
export function getRetryConfigForError(errorCode: string): Partial<RetryConfig> {
  switch (errorCode) {
    case 'EXPIRED':
    case 'PERMISSION_DENIED':
    case 'NOT_FOUND':
    case 'INVALID_PAYLOAD':
    case 'PAYLOAD_TOO_LARGE':
      // Don't retry these
      return { maxAttempts: 1 };

    case 'RATE_LIMITED':
      // Retry with longer delays
      return { maxAttempts: 5, baseDelay: 5000, maxDelay: 300000 };

    case 'TIMEOUT':
    case 'NETWORK':
      // Retry more times with standard delays
      return { maxAttempts: 4, baseDelay: 2000 };

    case 'SERVER_ERROR':
    case 'SERVICE_UNAVAILABLE':
      // Retry with moderate delays
      return { maxAttempts: 3, baseDelay: 3000 };

    default:
      // Default config
      return {};
  }
}
