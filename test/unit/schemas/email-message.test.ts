import assert from 'assert';

import { createEmailRecipientsSchema, createMessageResultSchema, EMAIL_COMMON_PATTERNS, EMAIL_FIELD_DESCRIPTIONS, EMAIL_FIELDS, EmailDetailSchema, EmailSummarySchema } from '../../../src/schemas/email-message.ts';
import { LONG_EMAIL, MINIMAL_EMAIL_SUMMARY, SAMPLE_EMAIL_DETAIL, SAMPLE_EMAIL_SUMMARY, UNICODE_EMAIL } from '../../lib/test-data.ts';

// ============================================================================
// EMAIL_FIELDS TESTS
// ============================================================================

describe('EMAIL_FIELDS', () => {
  it('is an array of strings', () => {
    assert.ok(Array.isArray(EMAIL_FIELDS));
    assert.ok(EMAIL_FIELDS.every((f) => typeof f === 'string'));
  });

  it('has expected field count', () => {
    // At least the common fields should be present
    assert.ok(EMAIL_FIELDS.length >= 10);
  });

  it('contains no duplicates', () => {
    const unique = [...new Set(EMAIL_FIELDS)];
    assert.strictEqual(unique.length, EMAIL_FIELDS.length);
  });

  it('contains expected core fields', () => {
    assert.ok(EMAIL_FIELDS.includes('id'));
    assert.ok(EMAIL_FIELDS.includes('subject'));
    assert.ok(EMAIL_FIELDS.includes('from'));
    assert.ok(EMAIL_FIELDS.includes('to'));
    assert.ok(EMAIL_FIELDS.includes('date'));
    assert.ok(EMAIL_FIELDS.includes('body'));
  });
});

describe('EMAIL_FIELD_DESCRIPTIONS', () => {
  it('has description for every field in EMAIL_FIELDS', () => {
    for (const field of EMAIL_FIELDS) {
      assert.ok(field in EMAIL_FIELD_DESCRIPTIONS, `Missing description for field: ${field}`);
    }
  });

  it('all descriptions are non-empty strings', () => {
    for (const [field, description] of Object.entries(EMAIL_FIELD_DESCRIPTIONS)) {
      assert.strictEqual(typeof description, 'string', `Description for ${field} should be string`);
      assert.ok(description.length > 0, `Description for ${field} should not be empty`);
    }
  });

  it('has no extra keys beyond EMAIL_FIELDS', () => {
    type EmailField = (typeof EMAIL_FIELDS)[number];
    const extraKeys = Object.keys(EMAIL_FIELD_DESCRIPTIONS).filter((key) => !EMAIL_FIELDS.includes(key as EmailField));
    assert.deepStrictEqual(extraKeys, []);
  });

  it('contains descriptive text (not just field name)', () => {
    // Check a few key descriptions are actually descriptive
    for (const field of ['id', 'subject', 'from']) {
      const desc = EMAIL_FIELD_DESCRIPTIONS[field];
      assert.ok(desc, `Description for ${field} should exist`);
      assert.ok(desc.length > field.length, `Description for ${field} should be more than just the field name`);
    }
  });
});

describe('EMAIL_COMMON_PATTERNS', () => {
  it('is an array of pattern objects', () => {
    assert.ok(Array.isArray(EMAIL_COMMON_PATTERNS));
    assert.strictEqual(EMAIL_COMMON_PATTERNS.length, 3);
  });

  it('each pattern has required properties', () => {
    for (const pattern of EMAIL_COMMON_PATTERNS) {
      assert.ok('name' in pattern);
      assert.ok('fields' in pattern);
      assert.ok('tokens' in pattern);
    }
  });

  it('all pattern names are strings', () => {
    for (const pattern of EMAIL_COMMON_PATTERNS) {
      assert.strictEqual(typeof pattern.name, 'string');
      assert.ok(pattern.name.length > 0);
    }
  });

  it('all pattern fields are comma-separated strings', () => {
    for (const pattern of EMAIL_COMMON_PATTERNS) {
      assert.strictEqual(typeof pattern.fields, 'string');
      assert.ok(pattern.fields.length > 0);
      // Should be comma-separated field names
      assert.ok(pattern.fields.includes(',') || pattern.fields.split(',').length === 1);
    }
  });

  it('all pattern tokens are strings', () => {
    for (const pattern of EMAIL_COMMON_PATTERNS) {
      assert.strictEqual(typeof pattern.tokens, 'string');
      assert.ok(pattern.tokens.includes('tokens'));
    }
  });

  it('patterns have distinct names', () => {
    const names = EMAIL_COMMON_PATTERNS.map((p) => p.name);
    const unique = [...new Set(names)];
    assert.strictEqual(unique.length, names.length);
  });

  it('bulk operations pattern is first', () => {
    assert.ok(EMAIL_COMMON_PATTERNS[0].name.includes('Bulk'));
  });

  it('full analysis pattern includes body', () => {
    const fullPattern = EMAIL_COMMON_PATTERNS.find((p) => p.name.includes('Full'));
    assert.ok(fullPattern);
    assert.ok(fullPattern.fields.includes('body'));
  });
});

// ============================================================================
// EmailSummarySchema TESTS
// ============================================================================

describe('EmailSummarySchema', () => {
  describe('valid inputs', () => {
    it('validates complete email summary with all fields', () => {
      const result = EmailSummarySchema.safeParse(SAMPLE_EMAIL_SUMMARY);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.id, SAMPLE_EMAIL_SUMMARY.id);
        assert.strictEqual(result.data.subject, SAMPLE_EMAIL_SUMMARY.subject);
        assert.strictEqual(result.data.from, SAMPLE_EMAIL_SUMMARY.from);
      }
    });

    it('validates minimal email with only some fields', () => {
      const result = EmailSummarySchema.safeParse(MINIMAL_EMAIL_SUMMARY);
      assert.strictEqual(result.success, true);
    });

    it('validates empty object (all fields optional)', () => {
      const result = EmailSummarySchema.safeParse({});
      assert.strictEqual(result.success, true);
    });

    it('validates email with unicode content', () => {
      const result = EmailSummarySchema.safeParse(UNICODE_EMAIL);
      assert.strictEqual(result.success, true);
    });

    it('validates email with very long strings', () => {
      const result = EmailSummarySchema.safeParse(LONG_EMAIL);
      assert.strictEqual(result.success, true);
    });

    it('validates email with empty arrays', () => {
      const email = { ...SAMPLE_EMAIL_SUMMARY, labelIds: [] };
      const result = EmailSummarySchema.safeParse(email);
      assert.strictEqual(result.success, true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects id with wrong type (number)', () => {
      const invalid = { ...SAMPLE_EMAIL_SUMMARY, id: 123 };
      const result = EmailSummarySchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });

    it('rejects isRead with wrong type (string)', () => {
      const invalid = { ...SAMPLE_EMAIL_SUMMARY, isRead: 'true' };
      const result = EmailSummarySchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });

    it('rejects hasAttachments with wrong type (number)', () => {
      const invalid = { ...SAMPLE_EMAIL_SUMMARY, hasAttachments: 1 };
      const result = EmailSummarySchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });

    it('rejects labelIds with non-string elements', () => {
      const invalid = { ...SAMPLE_EMAIL_SUMMARY, labelIds: ['INBOX', 123, 'SENT'] };
      const result = EmailSummarySchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });

    it('rejects labelIds with wrong type (not array)', () => {
      const invalid = { ...SAMPLE_EMAIL_SUMMARY, labelIds: 'INBOX' };
      const result = EmailSummarySchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });

    it('rejects attachmentCount with wrong type (string)', () => {
      const invalid = { ...SAMPLE_EMAIL_SUMMARY, attachmentCount: '2' };
      const result = EmailSummarySchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });
  });

  describe('optional field behavior', () => {
    it('allows omitted optional fields', () => {
      const minimal = { id: 'msg_123' };
      const result = EmailSummarySchema.safeParse(minimal);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.subject, undefined);
        assert.strictEqual(result.data.from, undefined);
      }
    });

    it('preserves undefined vs omitted distinction', () => {
      const withUndefined = { id: 'msg_123', subject: undefined };
      const result = EmailSummarySchema.safeParse(withUndefined);
      assert.strictEqual(result.success, true);
    });
  });
});

// ============================================================================
// EmailDetailSchema TESTS
// ============================================================================

describe('EmailDetailSchema', () => {
  describe('valid inputs', () => {
    it('validates complete email detail with all fields', () => {
      const result = EmailDetailSchema.safeParse(SAMPLE_EMAIL_DETAIL);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.body, SAMPLE_EMAIL_DETAIL.body);
        assert.strictEqual(result.data.attachmentCount, SAMPLE_EMAIL_DETAIL.attachmentCount);
      }
    });

    it('validates email detail with text body content type', () => {
      const email = { ...SAMPLE_EMAIL_DETAIL, bodyContentType: 'text' as const };
      const result = EmailDetailSchema.safeParse(email);
      assert.strictEqual(result.success, true);
    });

    it('validates email detail with html body content type', () => {
      const email = { ...SAMPLE_EMAIL_DETAIL, bodyContentType: 'html' as const };
      const result = EmailDetailSchema.safeParse(email);
      assert.strictEqual(result.success, true);
    });

    it('validates email detail with attachments array', () => {
      const email = {
        ...SAMPLE_EMAIL_DETAIL,
        attachments: [
          { id: 'att_1', filename: 'doc.pdf', mimeType: 'application/pdf', size: 1024 },
          { id: 'att_2', filename: 'image.png', mimeType: 'image/png' }, // size optional
        ],
      };
      const result = EmailDetailSchema.safeParse(email);
      assert.strictEqual(result.success, true);
    });

    it('validates email detail with empty attachments array', () => {
      const email = { ...SAMPLE_EMAIL_DETAIL, attachments: [] };
      const result = EmailDetailSchema.safeParse(email);
      assert.strictEqual(result.success, true);
    });

    it('extends EmailSummarySchema (inherits all summary fields)', () => {
      // EmailDetailSchema should accept all EmailSummary fields
      const summary = SAMPLE_EMAIL_SUMMARY;
      const result = EmailDetailSchema.safeParse(summary);
      assert.strictEqual(result.success, true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects bodyContentType with invalid value', () => {
      const invalid = { ...SAMPLE_EMAIL_DETAIL, bodyContentType: 'markdown' };
      const result = EmailDetailSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });

    it('rejects attachments with missing required fields', () => {
      const invalid = {
        ...SAMPLE_EMAIL_DETAIL,
        attachments: [{ filename: 'doc.pdf' }], // missing id and mimeType
      };
      const result = EmailDetailSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });

    it('rejects attachments with wrong field types', () => {
      const invalid = {
        ...SAMPLE_EMAIL_DETAIL,
        attachments: [{ id: 123, filename: 'doc.pdf', mimeType: 'application/pdf' }],
      };
      const result = EmailDetailSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });

    it('rejects attachments size with wrong type', () => {
      const invalid = {
        ...SAMPLE_EMAIL_DETAIL,
        attachments: [{ id: 'att_1', filename: 'doc.pdf', mimeType: 'application/pdf', size: '1024' }],
      };
      const result = EmailDetailSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);
    });
  });

  describe('attachment schema details', () => {
    it('validates attachment with all fields', () => {
      const email = {
        id: 'msg_123',
        attachments: [
          {
            id: 'att_xyz',
            filename: 'report.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 524288,
          },
        ],
      };
      const result = EmailDetailSchema.safeParse(email);
      assert.strictEqual(result.success, true);
    });

    it('validates attachment without optional size field', () => {
      const email = {
        id: 'msg_123',
        attachments: [{ id: 'att_xyz', filename: 'doc.pdf', mimeType: 'application/pdf' }],
      };
      const result = EmailDetailSchema.safeParse(email);
      assert.strictEqual(result.success, true);
    });
  });
});

// ============================================================================
// SCHEMA RELATIONSHIP TESTS
// ============================================================================

describe('schema relationship', () => {
  it('EmailDetailSchema accepts EmailSummary data', () => {
    // Detail schema extends summary, so summary data should be valid
    const result = EmailDetailSchema.safeParse(SAMPLE_EMAIL_SUMMARY);
    assert.strictEqual(result.success, true);
  });

  it('EmailDetailSchema has additional fields beyond EmailSummary', () => {
    const detailOnlyFields = {
      body: '<p>Email body content</p>',
      bodyContentType: 'html' as const,
      attachments: [],
    };

    // These fields are specific to EmailDetail
    const withDetailFields = { ...SAMPLE_EMAIL_SUMMARY, ...detailOnlyFields };
    const result = EmailDetailSchema.safeParse(withDetailFields);
    assert.strictEqual(result.success, true);
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('createEmailRecipientsSchema()', () => {
  it('creates required schema for "to" field by default', () => {
    const schema = createEmailRecipientsSchema();
    const result = schema.safeParse(undefined);
    assert.ok(!result.success, 'Should reject undefined for required field');
  });

  it('creates optional schema when required is false', () => {
    const schema = createEmailRecipientsSchema('to', false);
    const data = schema.parse(undefined);
    assert.strictEqual(data, undefined);
  });

  it('accepts single email address', () => {
    const schema = createEmailRecipientsSchema();
    const data = schema.parse('alice@example.com');
    assert.strictEqual(data, 'alice@example.com');
  });

  it('accepts comma-separated email addresses', () => {
    const schema = createEmailRecipientsSchema();
    const data = schema.parse('alice@example.com, bob@example.com');
    assert.strictEqual(data, 'alice@example.com, bob@example.com');
  });

  it('includes appropriate description for "to" field', () => {
    const schema = createEmailRecipientsSchema('to', true);
    assert.ok(schema.description?.includes('Recipient email address'));
  });

  it('includes appropriate description for "cc" field', () => {
    const schema = createEmailRecipientsSchema('cc', true);
    assert.ok(schema.description?.includes('CC recipients'));
  });

  it('includes appropriate description for "bcc" field', () => {
    const schema = createEmailRecipientsSchema('bcc', true);
    assert.ok(schema.description?.includes('BCC recipients'));
    assert.ok(schema.description?.includes('hidden copy'));
  });

  it('rejects empty string for required field', () => {
    const schema = createEmailRecipientsSchema('to', true);
    const result = schema.safeParse('');
    assert.ok(!result.success, 'Should reject empty string');
  });
});

describe('createMessageResultSchema()', () => {
  it('creates schema for gmail message', () => {
    const schema = createMessageResultSchema('gmail');
    const validMessage = {
      id: 'msg-123',
      sentAt: '2024-01-01T10:00:00Z',
      recipientCount: 3,
    };
    const data = schema.parse(validMessage);
    assert.strictEqual(data.id, 'msg-123');
  });

  it('creates schema for outlook message', () => {
    const schema = createMessageResultSchema('outlook');
    const validMessage = {
      id: 'msg-456',
      sentAt: '2024-01-01T10:00:00Z',
      recipientCount: 2,
    };
    const data = schema.parse(validMessage);
    assert.strictEqual(data.id, 'msg-456');
  });

  it('requires id, sentAt, and recipientCount', () => {
    const schema = createMessageResultSchema('gmail');
    const invalid = { id: 'msg-123' }; // Missing required fields
    const result = schema.safeParse(invalid);
    assert.ok(!result.success, 'Should reject when missing required fields');
  });

  it('accepts optional threadId', () => {
    const schema = createMessageResultSchema('gmail');
    const validMessage = {
      id: 'msg-123',
      threadId: 'thread-789',
      sentAt: '2024-01-01T10:00:00Z',
      recipientCount: 1,
    };
    const data = schema.parse(validMessage);
    assert.strictEqual(data.threadId, 'thread-789');
  });

  it('accepts optional webLink', () => {
    const schema = createMessageResultSchema('outlook');
    const validMessage = {
      id: 'msg-123',
      sentAt: '2024-01-01T10:00:00Z',
      recipientCount: 1,
      webLink: 'https://outlook.com/mail/msg-123',
    };
    const data = schema.parse(validMessage);
    assert.strictEqual(data.webLink, 'https://outlook.com/mail/msg-123');
  });

  it('accepts optional size', () => {
    const schema = createMessageResultSchema('gmail');
    const validMessage = {
      id: 'msg-123',
      sentAt: '2024-01-01T10:00:00Z',
      recipientCount: 1,
      size: 1024,
    };
    const data = schema.parse(validMessage);
    assert.strictEqual(data.size, 1024);
  });
});
