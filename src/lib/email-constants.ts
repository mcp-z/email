/**
 * Email batch processing constants
 *
 * Shared constants for batch operations across Gmail and Outlook servers.
 * These values are tuned for email API rate limits and optimal throughput.
 */

/**
 * Number of items to process in parallel per chunk.
 * Balances throughput against API rate limits.
 */
export const EMAIL_CHUNK_SIZE = 10;

/**
 * Maximum number of items allowed in a single batch operation.
 * Prevents memory issues and excessive API usage.
 */
export const EMAIL_MAX_BATCH_SIZE = 500;
