/**
 * Helper functions for working with Supabase Edge Functions
 */

/**
 * Generates the correct slug for a Supabase Edge Function based on its file path
 * @param functionPath - The path to the function, e.g. "supabase/functions/cancel-subscription/index.ts"
 * @returns The slug to use when invoking the function
 */
export function getEdgeFunctionSlug(functionPath: string): string {
  // Remove /index.ts from the path
  const pathWithoutFile = functionPath.replace(/\/index\.ts$/, "");

  // Replace all forward slashes with hyphens
  const slug = pathWithoutFile.replace(/\//g, "-");

  // Remove any characters that aren't alphanumeric, underscore, or hyphen
  return slug.replace(/[^A-Za-z0-9_-]/g, "");
}

/**
 * Returns the correct slug for the cancel-subscription function
 */
export function getCancelSubscriptionSlug(): string {
  return "supabase-functions-cancel-subscription";
}
