/**
 * Utility for consistent error logging across the application
 */

// Determine if we're in production
const isProduction = process.env.NODE_ENV === "production";

/**
 * Log an error with consistent formatting
 * In production, this will only log critical errors
 */
export function logError(message: string, error: any, critical = false) {
  // In production, only log critical errors
  if (isProduction && !critical) return;

  console.error(`[ERROR] ${message}:`, error);
}

/**
 * Log a warning with consistent formatting
 * In production, this will not log anything
 */
export function logWarning(message: string, details?: any) {
  if (isProduction) return;

  if (details) {
    console.warn(`[WARNING] ${message}:`, details);
  } else {
    console.warn(`[WARNING] ${message}`);
  }
}

/**
 * Log info with consistent formatting
 * In production, this will not log anything
 */
export function logInfo(message: string, details?: any) {
  if (isProduction) return;

  if (details) {
    console.log(`[INFO] ${message}:`, details);
  } else {
    console.log(`[INFO] ${message}`);
  }
}

/**
 * Safely stringify an object for logging
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(
      obj,
      (key, value) => {
        if (value instanceof Error) {
          return {
            message: value.message,
            stack: value.stack,
            ...value,
          };
        }
        return value;
      },
      2,
    );
  } catch (error) {
    return "[Object could not be stringified]";
  }
}

/**
 * Format an error for consistent error responses
 */
export function formatErrorResponse(error: any): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error)
    return error.message;
  return "An unexpected error occurred";
}
