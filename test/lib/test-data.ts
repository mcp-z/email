/**
 * Shared test fixtures for @mcp-z/email tests
 *
 * This file contains synthetic test data for:
 * - Email addresses in various formats
 * - HTML content samples
 * - Email thread excerpts with quote patterns
 * - Sample email objects
 * - Invalid inputs for error testing
 */

import type { EmailDetail, EmailSummary } from '../../src/index.ts';

// ============================================================================
// EMAIL ADDRESSES - Various RFC 2822 formats
// ============================================================================

export const SAMPLE_ADDRESSES = {
  standard: '"John Doe" <john@example.com>',
  emailOnly: 'john@example.com',
  nameWithoutQuotes: 'John Doe <john@example.com>',
  nameWithApostrophe: '"O\'Brien, Kevin" <kevin@example.com>',
  nameWithComma: '"Doe, John" <john@example.com>',
  unicode: '"José García" <jose@example.com>',
  emoji: '"John 🎉 Doe" <john@example.com>',
  multipleSpaces: '"John   Doe" <john@example.com>',
  trailingSpaces: '"John Doe " <john@example.com>',
  emptyName: '"" <john@example.com>',
  escapedQuotes: '"John \\"Johnny\\" Doe" <john@example.com>',
  multipleComma: 'john@example.com, jane@example.com, bob@example.com',
  multipleSemicolon: 'john@example.com; jane@example.com; bob@example.com',
  mixedFormats: '"John Doe" <john@example.com>, jane@example.com, Bob <bob@example.com>',
  commaInName: '"Doe, John" <john@example.com>, "Smith, Jane" <jane@example.com>',
};

export const SAMPLE_ADDRESS_ARRAYS = {
  simple: ['john@example.com', 'jane@example.com'],
  withNames: ['"John Doe" <john@example.com>', '"Jane Smith" <jane@example.com>'],
  mixed: ['john@example.com', '"Jane Smith" <jane@example.com>', 'bob@example.com'],
  withEmpty: ['john@example.com', '', 'jane@example.com'],
};

// ============================================================================
// HTML CONTENT SAMPLES
// ============================================================================

export const HTML_SAMPLES = {
  simpleParagraph: '<p>Hello World</p>',
  nestedTags: '<div><p>Hello <strong>World</strong></p></div>',
  withAttributes: '<p class="text" id="main">Hello World</p>',
  multipleParagraphs: '<p>First paragraph</p><p>Second paragraph</p><p>Third paragraph</p>',
  withBreaks: '<p>Line one<br/>Line two<br/>Line three</p>',
  withEntities: '<p>&lt;tag&gt; &amp; &quot;quotes&quot; &nbsp; text</p>',
  withUnicode: '<p>José García 🎉 says hello!</p>',
  withScripts: '<p>Visible text</p><script>alert("hidden")</script><style>.hidden { display: none; }</style>',
  malformed: '<p>Hello</div><div>World</p>',
  unclosedTags: '<p>Hello <strong>World',
  empty: '',
  onlyTags: '<div></div><p></p>',
  withWhitespace: '<p>  Hello  World  </p>',
  withBlockquote: '<p>Current message</p><blockquote>Quoted message</blockquote>',
  nestedBlockquotes: '<p>Current</p><blockquote><blockquote>Deep quote</blockquote>Outer quote</blockquote>',
  multipleBlockquotes: '<p>Current</p><blockquote>Quote 1</blockquote><p>More current</p><blockquote>Quote 2</blockquote>',
  gmailQuote: '<p>Reply</p><blockquote class="gmail_quote" style="margin:0">Quoted Gmail message</blockquote>',
};

// ============================================================================
// EMAIL THREAD EXCERPTS - Quote patterns
// ============================================================================

export const EMAIL_THREADS = {
  gmailQuote: `This is my reply to your message.

On Mon, Jan 1, 2024 at 10:00 AM User <user@example.com> wrote:
> This is the original message
> that was sent earlier.`,

  outlookQuote: `This is my reply.

From: User <user@example.com>
Sent: Monday, January 1, 2024 10:00 AM
To: recipient@example.com
Subject: RE: Important Topic

This is the original message.`,

  genericQuote: `This is my reply.

> This is quoted text
> More quoted text
> Even more quoted text`,

  originalMessageDelimiter: `This is my reply.

-----Original Message-----
From: user@example.com [mailto:user@example.com]
Sent: Monday, January 1, 2024 10:00 AM
Subject: Original Subject

This is the original message.`,

  forwardedMessage: `Check out this message below.

--- Forwarded message ---
From: Someone <someone@example.com>
Date: Mon, Jan 1, 2024 at 10:00 AM
Subject: Interesting Topic
To: forwarded@example.com

This is the forwarded content.`,

  nestedQuotes: `This is the newest reply.

On Mon, Jan 1, 2024 at 11:00 AM User2 <user2@example.com> wrote:
> This is the second reply.
>
> On Mon, Jan 1, 2024 at 10:00 AM User1 <user1@example.com> wrote:
> > This is the original message.`,

  quoteInMiddle: `This is the beginning of my message.

On Mon, Jan 1, 2024 at 10:00 AM User <user@example.com> wrote:
> Quoted text here

And this is more of my message after the quote.`,

  noQuotes: `This is a clean message with no quotes.
It has multiple lines.
But no quote markers anywhere.`,

  unicodeQuote: `This is my reply with émojis 🎉.

On Mon, Jan 1, 2024 at 10:00 AM José García <jose@example.com> wrote:
> Hola! ¿Cómo estás? 😊
> This is a message with unicode characters.`,
};

// ============================================================================
// SAMPLE EMAIL OBJECTS
// ============================================================================

export const SAMPLE_EMAIL_SUMMARY: EmailSummary = {
  id: 'msg_abc123',
  threadId: 'thread_xyz789',
  subject: 'Test Email Subject',
  from: 'sender@example.com',
  fromName: 'Sender Name',
  to: 'recipient@example.com',
  cc: 'cc@example.com',
  bcc: 'bcc@example.com',
  date: '2024-01-15T10:30:00.000Z',
  snippet: 'This is a preview of the email content...',
  isRead: false,
  hasAttachments: true,
  labelIds: ['INBOX', 'IMPORTANT'],
};

export const SAMPLE_EMAIL_DETAIL: EmailDetail = {
  ...SAMPLE_EMAIL_SUMMARY,
  body: '<p>This is the full email body content with <strong>HTML</strong> formatting.</p>',
  attachmentCount: 2,
  isImportant: true,
  folderName: 'Inbox',
};

// Minimal email (only required fields)
export const MINIMAL_EMAIL_SUMMARY: EmailSummary = {
  id: 'msg_minimal',
  subject: 'Minimal Email',
  from: 'sender@example.com',
  date: '2024-01-15T10:30:00.000Z',
  snippet: 'Minimal email with only required fields',
  isRead: true,
};

// Email with unicode content
export const UNICODE_EMAIL: EmailSummary = {
  id: 'msg_unicode',
  subject: 'Unicode Test: 日本語 & Émojis 🎉',
  from: '"José García" <jose@example.com>',
  fromName: 'José García',
  date: '2024-01-15T10:30:00.000Z',
  snippet: 'Testing unicode: 你好世界 Привет мир مرحبا بالعالم',
  isRead: false,
};

// Email with very long content
export const LONG_EMAIL: EmailSummary = {
  id: 'msg_long',
  subject: 'A'.repeat(200), // Very long subject
  from: 'sender@example.com',
  date: '2024-01-15T10:30:00.000Z',
  snippet: 'B'.repeat(500), // Very long snippet
  isRead: true,
};

// ============================================================================
// INVALID INPUTS for error testing
// ============================================================================

export const INVALID_INPUTS = {
  // Invalid addresses
  emptyString: '',
  whitespaceOnly: '   ',
  justName: 'John Doe',
  malformedEmail: 'not-an-email',
  missingBracket: '"John Doe" <john@example.com',

  // Invalid dates
  invalidDate: 'not-a-date',
  invalidTimestamp: Number.NaN,

  // Invalid base64
  invalidBase64: 'not-valid-base64!@#',

  // Edge case values
  null: null,
  undefined: undefined,
};

// ============================================================================
// BASE64URL TEST DATA
// ============================================================================

export const BASE64URL_SAMPLES = {
  // Valid base64url strings (Gmail token format)
  valid: {
    withoutPadding: 'SGVsbG8gV29ybGQ',
    withPadding: 'SGVsbG8gV29ybGQ=',
    withUrlSafeChars: 'A-Z_test',
    long: 'VGhpcyBpcyBhIGxvbmdlciBzdHJpbmcgdGhhdCByZXF1aXJlcyBtb3JlIGJhc2U2NCBlbmNvZGluZw',
  },

  // Invalid base64url
  invalid: {
    withInvalidChars: 'invalid!@#$%',
    partial: 'SGVs',
    randomText: 'this is not base64',
  },
};

// ============================================================================
// QUERY OBJECTS for schema testing
// ============================================================================

// ============================================================================
// REAL-WORLD EMAIL HTML SAMPLES - Provider-specific thread patterns
// ============================================================================

export const REAL_EMAIL_HTML = {
  // Gmail reply chain with nested blockquotes
  gmailReplyChain: `<div dir="ltr">My reply here</div>
<div class="gmail_quote">
  <div dir="ltr" class="gmail_attr">On Mon, Jan 1, 2024 at 10:00 AM User wrote:</div>
  <blockquote class="gmail_quote" style="margin:0px">
    <div dir="ltr">Previous message</div>
  </blockquote>
</div>`,

  // Gmail using .gmail_quote div (no blockquote)
  gmailQuoteDiv: `<div dir="ltr">My reply content</div>
<div class="gmail_quote">
  <div class="gmail_attr">On Mon, Jan 1, 2024 at 10:00 AM wrote:</div>
  <div>Quoted message content here</div>
</div>`,

  // Gmail with .gmail_extra (signature + quote)
  gmailWithSignature: `<div dir="ltr">Main content</div>
<div class="gmail_extra">
  <div class="gmail_signature">-- <br>My Signature</div>
  <div class="gmail_quote">Quoted content from previous message</div>
</div>`,

  // Outlook reply with divRplyFwdMsg
  outlookReply: `<html><body>
<div>My reply content</div>
<div id="divRplyFwdMsg">
  <hr>
  <b>From:</b> sender@example.com<br>
  <b>Sent:</b> Monday, January 1, 2024 10:00 AM<br>
  <b>Subject:</b> Original subject<br>
</div>
<div>Original message content</div>
</body></html>`,

  // Outlook with appendonsend marker
  outlookAppendOnSend: `<html><body>
<div>My response here</div>
<div id="appendonsend"></div>
<hr style="display:inline-block;width:98%">
<div>Previous thread content</div>
</body></html>`,

  // Outlook with data-outlook-is-reply attribute
  outlookDataAttribute: `<html><body>
<div>Current message</div>
<div data-outlook-is-reply="true">
  <div>This is the quoted reply section</div>
</div>
</body></html>`,

  // Apple Mail with type="cite" blockquote
  appleMailReply: `<div>My reply</div>
<blockquote type="cite">
  <div>On Jan 1, 2024, at 10:00 AM, User wrote:</div>
  <div>Original message</div>
</blockquote>`,

  // Complex multi-provider thread
  mixedProviderThread: `<div>Latest reply from Gmail</div>
<div class="gmail_quote">
  <blockquote>
    <div id="divRplyFwdMsg">
      Outlook reply content
      <blockquote type="cite">
        Apple Mail original
      </blockquote>
    </div>
  </blockquote>
</div>`,

  // Standard blockquote without provider classes
  standardBlockquote: `<div>Reply content</div>
<blockquote>
  <p>This is quoted text</p>
  <p>More quoted text</p>
</blockquote>`,

  // Nested blockquotes
  nestedBlockquotes: `<div>Latest reply</div>
<blockquote>
  <div>First level quote</div>
  <blockquote>
    <div>Second level quote</div>
    <blockquote>
      <div>Third level quote</div>
    </blockquote>
  </blockquote>
</blockquote>`,

  // No quotes - clean message
  noQuotes: `<div>Just a clean message</div>
<p>With multiple paragraphs</p>
<p>And no quoted content</p>`,

  // Empty content
  empty: '',

  // Malformed HTML
  malformed: '<div>Reply content<blockquote>Unclosed quote',

  // Only whitespace
  whitespaceOnly: '   \n\n   ',
};

// Expected results after extractCurrentMessageFromHtml
export const EXPECTED_THREAD_EXTRACTION = {
  gmailReplyChain: '<div dir="ltr">My reply here</div>\n',
  gmailQuoteDiv: '<div dir="ltr">My reply content</div>\n',
  gmailWithSignature: '<div dir="ltr">Main content</div>\n',
  outlookReply: '<html><body>\n<div>My reply content</div>\n\n<div>Original message content</div>\n</body></html>',
  outlookAppendOnSend: '<html><body>\n<div>My response here</div>\n\n<hr style="display:inline-block;width:98%">\n<div>Previous thread content</div>\n</body></html>',
  appleMailReply: '<div>My reply</div>\n',
  standardBlockquote: '<div>Reply content</div>\n',
  nestedBlockquotes: '<div>Latest reply</div>\n',
  noQuotes: '<div>Just a clean message</div>\n<p>With multiple paragraphs</p>\n<p>And no quoted content</p>',
  empty: '',
};

export const QUERY_SAMPLES = {
  // Simple query with base fields
  simple: {
    from: 'alice@example.com',
    subject: 'invoice',
  },

  // Query with FieldOperator
  withFieldOperator: {
    from: { $any: ['alice@example.com', 'bob@example.com'] },
    subject: { $none: ['spam'] },
  },

  // Query with date range
  withDateRange: {
    date: { $gte: '2024-01-01', $lt: '2024-02-01' },
  },

  // Query with boolean flags
  withFlags: {
    hasAttachment: true,
    isRead: false,
  },

  // Complex query with logical operators (for composition tests)
  complex: {
    $and: [
      { from: 'alice@example.com' },
      { hasAttachment: true },
      {
        $or: [{ subject: 'invoice' }, { subject: 'receipt' }],
      },
    ],
  },
};
