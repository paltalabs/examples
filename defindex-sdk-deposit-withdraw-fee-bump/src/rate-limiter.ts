/**
 * Rate limiter utility to handle 429 errors with exponential backoff
 *
 * @param fn - The async function to execute with rate limiting
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @param initialDelay - Initial delay in milliseconds (default: 1000ms)
 * @returns The result of the function execution
 * @throws The last error if all retries are exhausted
 */
export async function withRateLimit<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error
      if (error?.statusCode === 429 || error?.error === 'Too Many Requests') {
        const retryAfter = error?.retryAfter || 1;
        const delayMs = Math.max(retryAfter * 1000, initialDelay * Math.pow(2, attempt));

        if (attempt < maxRetries) {
          console.log(`⏳ Rate limit hit. Waiting ${delayMs}ms before retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
      }

      // If it's not a rate limit error, or we've exhausted retries, throw
      throw error;
    }
  }

  throw lastError;
}
