/**
 * Email tool input schema fragments
 *
 * Shared Zod schema definitions for email tool input parameters.
 * These are used across Gmail and Outlook tools for consistent API surface.
 */

import { z } from 'zod';

/**
 * Content type schema for reading/fetching email body content.
 * Used in: message-get, message-search, messages-export-csv
 *
 * Determines whether the body is returned as plain text or preserved HTML.
 */
export const EmailContentTypeSchema = z.enum(['text', 'html']).optional().default('text').describe('Format for body content: text extracts plain text, html preserves HTML structure');

/**
 * Thread history exclusion schema for reading emails.
 * Used in: message-get, message-search, messages-export-csv
 *
 * When true, removes quoted previous messages from the email body,
 * showing only the current message content.
 */
export const ExcludeThreadHistorySchema = z.boolean().optional().default(false).describe('When true, removes quoted thread history from body content');

/**
 * Content type schema for composing/sending email content.
 * Used in: message-send, message-respond
 *
 * Specifies the format of the body content being sent.
 */
export const ComposeContentTypeSchema = z.enum(['text', 'html']).optional().default('text').describe('Format of the body content');

/** Convenience type for email reading content type */
export type EmailContentType = z.infer<typeof EmailContentTypeSchema>;

/** Convenience type for thread history exclusion */
export type ExcludeThreadHistory = z.infer<typeof ExcludeThreadHistorySchema>;

/** Convenience type for email composing content type */
export type ComposeContentType = z.infer<typeof ComposeContentTypeSchema>;
