/**
 * Email message schemas and constants
 *
 * This module contains everything related to email message structure:
 * - Field definitions and descriptions for UI/tool hints
 * - Zod schemas for message validation (Summary, Detail)
 * - Factory functions for recipient and result schemas
 * - Export headers for CSV/spreadsheet output
 */

import { z } from 'zod';

// ============================================================================
// FIELD DEFINITIONS - Constants for field selection across Gmail and Outlook
// ============================================================================

export const EMAIL_FIELDS = ['id', 'threadId', 'subject', 'from', 'fromName', 'to', 'cc', 'bcc', 'date', 'snippet', 'body', 'isRead', 'isImportant', 'hasAttachments', 'attachmentCount', 'labelIds', 'folderName'] as const;

export const EMAIL_FIELD_DESCRIPTIONS: Record<string, string> = {
  id: 'Message ID (always included)',
  threadId: 'Conversation/thread ID',
  subject: 'Email subject line',
  from: 'Sender email address',
  fromName: 'Sender display name',
  to: 'Recipient email address(es)',
  cc: 'CC recipient(s)',
  bcc: 'BCC recipient(s)',
  date: 'Message date/time',
  snippet: 'Preview of message body (~100 chars)',
  body: 'Full message content (LARGE - use sparingly)',
  isRead: 'Read status boolean',
  isImportant: 'Priority/importance flag',
  hasAttachments: 'Has file attachments',
  attachmentCount: 'Number of attachments',
  labelIds: 'Gmail labels or Outlook categories',
  folderName: 'Folder/mailbox name',
};

export const EMAIL_COMMON_PATTERNS = [
  { name: 'Bulk operations (delete/move)', fields: 'id,subject,from', tokens: '~30 tokens/message' },
  { name: 'Browsing/filtering', fields: 'id,subject,from,date,snippet', tokens: '~50 tokens/message' },
  { name: 'Full analysis', fields: 'id,subject,from,to,date,body', tokens: '~200 tokens/message' },
] as const;

// ============================================================================
// EXPORT HEADERS - Column headers for CSV/spreadsheet export
// ============================================================================

export const EmailExportHeaders = ['id', 'provider', 'threadId', 'to', 'from', 'cc', 'bcc', 'date', 'subject', 'labels', 'snippet', 'body'] as const;

// ============================================================================
// MESSAGE SCHEMAS - Zod schemas for email message validation
// ============================================================================

export const EmailSummarySchema = z.object({
  id: z.string().optional(),
  threadId: z.string().optional().describe('Thread/conversation ID for grouping related messages'),
  subject: z.string().optional(),
  from: z.string().optional(),
  fromName: z.string().optional(),
  to: z.string().optional(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  date: z.string().optional().describe('Date in RFC 2822 format'),
  receivedDateTime: z.string().optional().describe('ISO datetime when message was received'),
  snippet: z.string().optional().describe('Short preview of the message body'),
  isRead: z.boolean().optional().describe('Whether the message has been read'),
  isImportant: z.boolean().optional().describe('Whether the message is marked as important/priority'),
  hasAttachments: z.boolean().optional().describe('Whether the message has file attachments'),
  attachmentCount: z.number().optional().describe('Number of attachments'),
  labelIds: z.array(z.string()).optional().describe('Gmail label IDs or Outlook category IDs'),
  folderName: z.string().optional().describe('Name of the folder/mailbox containing this message'),
});

export const EmailDetailSchema = EmailSummarySchema.extend({
  body: z.string().optional(),
  bodyContentType: z.enum(['text', 'html']).optional(),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        filename: z.string(),
        mimeType: z.string(),
        size: z.number().optional(),
      })
    )
    .optional()
    .describe('Detailed attachment information'),
});

export type EmailSummary = z.infer<typeof EmailSummarySchema>;
export type EmailDetail = z.infer<typeof EmailDetailSchema>;

// ============================================================================
// FACTORY FUNCTIONS - Create parameterized schemas for tools
// ============================================================================

/**
 * Schema for email recipients (single or array)
 */
export function createEmailRecipientsSchema(field: 'to' | 'cc' | 'bcc' = 'to', required = true) {
  const fieldLabels = {
    to: 'Recipient email address(es)',
    cc: 'CC recipients',
    bcc: 'BCC recipients (hidden copy)',
  };

  const description = `${fieldLabels[field]}. For multiple recipients, use comma-separated: "alice@example.com, bob@example.com"`;

  const schema = z.string().min(1).describe(description);

  return required ? schema : schema.optional().describe(`${description} (optional)`);
}

/**
 * Schema for message send/create results
 */
export function createMessageResultSchema(platform: 'gmail' | 'outlook') {
  const platformNames = {
    gmail: 'Gmail',
    outlook: 'Outlook',
  };

  return z.object({
    id: z.string().describe('Unique ID of the sent message'),
    threadId: z.string().optional().describe('Thread/conversation ID if applicable'),
    sentAt: z.string().describe('When the message was sent (ISO datetime)'),
    recipientCount: z.number().describe('Total number of recipients (to + cc + bcc)'),
    webLink: z.string().optional().describe(`Link to view the sent message in ${platformNames[platform]}`),
    size: z.number().optional().describe('Message size in bytes'),
  });
}
