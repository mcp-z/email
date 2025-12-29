/**
 * Email query DSL foundations
 *
 * This module provides the base building blocks for email query schemas.
 * Provider-specific packages (Gmail, Outlook) extend these with their own
 * features like fuzzyPhrase, categories, rawQuery escape hatches, etc.
 */

import { z } from 'zod';

/**
 * Field operator schema for combining multiple values in a single field.
 * Supports MongoDB-style operators for within-field logic.
 */
export const FieldOperatorSchema = z
  .object({
    $any: z.array(z.string()).optional().describe('OR within field - matches if ANY value matches'),
    $all: z.array(z.string()).optional().describe('AND within field - matches if ALL values match'),
    $none: z.array(z.string()).optional().describe('NOT within field - matches if NONE match'),
  })
  .strict();

export type FieldOperator = z.infer<typeof FieldOperatorSchema>;

/**
 * Base email query fields as TypeScript type.
 * Used for type composition in provider-specific query types.
 */
export type BaseEmailQueryFields = {
  from?: string | FieldOperator;
  to?: string | FieldOperator;
  cc?: string | FieldOperator;
  bcc?: string | FieldOperator;
  subject?: string | FieldOperator;
  body?: string | FieldOperator;
  text?: string | FieldOperator;
  hasAttachment?: boolean;
  isRead?: boolean;
  date?: {
    $gte?: string;
    $lt?: string;
  };
};

/**
 * Base email query fields shared across all providers (Gmail, Outlook, etc.).
 *
 * These fields work identically across all email providers:
 * - Email address fields: from, to, cc, bcc
 * - Content fields: subject, body, text
 * - Boolean flags: hasAttachment, isRead
 * - Date range: date { $gte, $lt }
 *
 * Providers extend these base fields with provider-specific features:
 * - Gmail: fuzzyPhrase, categories (primary/social/promotions), rawGmailQuery
 * - Outlook: exactPhrase, categories (work/personal/family), importance, kqlQuery
 *
 * Usage:
 * ```typescript
 * const GmailQuerySchema: unknown = z.lazy(() =>
 *   z.object({
 *     $and: z.array(GmailQuerySchema).optional(),
 *     $or: z.array(GmailQuerySchema).optional(),
 *     $not: GmailQuerySchema.optional(),
 *     ...baseEmailQueryFields,  // Spread base fields
 *     fuzzyPhrase: z.string().optional(),  // Gmail-specific
 *   }).strict()
 * );
 * ```
 */
export const baseEmailQueryFields: z.ZodRawShape = {
  // Email address fields - support both string and field operators
  from: z.union([z.string(), FieldOperatorSchema]).optional().describe('Filter by sender email address or name (partial match, case-insensitive)'),

  to: z.union([z.string(), FieldOperatorSchema]).optional().describe('Filter by recipient email address (partial match, case-insensitive)'),

  cc: z.union([z.string(), FieldOperatorSchema]).optional().describe('Filter by CC recipient email address (partial match, case-insensitive)'),

  bcc: z.union([z.string(), FieldOperatorSchema]).optional().describe('Filter by BCC recipient email address (partial match, case-insensitive)'),

  // Content fields - support both string and field operators
  subject: z.union([z.string(), FieldOperatorSchema]).optional().describe('Filter by subject line (partial match, case-insensitive)'),

  body: z.union([z.string(), FieldOperatorSchema]).optional().describe('Filter by email body content (partial match)'),

  text: z.union([z.string(), FieldOperatorSchema]).optional().describe('Search in both subject AND body (convenience shortcut)'),

  // Boolean flags - universal across providers
  hasAttachment: z.boolean().optional().describe('Filter messages with file attachments'),

  isRead: z.boolean().optional().describe('Filter by read status (true = read, false = unread)'),

  // Date range - same structure, provider-specific implementation
  date: z
    .object({
      $gte: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Messages on or after this date (YYYY-MM-DD)'),
      $lt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Messages before this date (YYYY-MM-DD)'),
    })
    .strict()
    .optional()
    .describe('Filter by date range'),
};
