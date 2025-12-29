import assert from 'assert';

import { buildContentForItems } from '../../../src/lib/email-formatting.ts';
import { LONG_EMAIL, MINIMAL_EMAIL_SUMMARY, SAMPLE_EMAIL_SUMMARY, UNICODE_EMAIL } from '../../lib/test-data.ts';

describe('email-formatting', () => {
  describe('buildContentForItems()', () => {
    it('returns array with one object for single email', () => {
      const result = buildContentForItems([SAMPLE_EMAIL_SUMMARY]);
      assert.strictEqual(Array.isArray(result), true);
      assert.strictEqual(result.length, 1);
      const firstItem = result[0];
      assert.ok(firstItem, 'First item should exist');
      assert.strictEqual(firstItem.type, 'text');
      assert.strictEqual(typeof firstItem.text, 'string');
    });

    it('returns array with multiple objects for multiple emails', () => {
      const items = [SAMPLE_EMAIL_SUMMARY, MINIMAL_EMAIL_SUMMARY];
      const result = buildContentForItems(items);
      assert.strictEqual(result.length, 2);
      const firstItem = result[0];
      const secondItem = result[1];
      assert.ok(firstItem, 'First item should exist');
      assert.ok(secondItem, 'Second item should exist');
      assert.strictEqual(firstItem.type, 'text');
      assert.strictEqual(secondItem.type, 'text');
    });

    it('handles empty array', () => {
      const result = buildContentForItems([]);
      assert.strictEqual(Array.isArray(result), true);
      assert.strictEqual(result.length, 0);
    });

    it('extracts subject field correctly', () => {
      const result = buildContentForItems([SAMPLE_EMAIL_SUMMARY]);
      const firstItem = result[0];
      assert.ok(firstItem, 'First item should exist');
      assert.strictEqual(firstItem.subject, 'Test Email Subject');
    });

    it('extracts from field correctly', () => {
      const result = buildContentForItems([SAMPLE_EMAIL_SUMMARY]);
      const firstItem = result[0];
      assert.ok(firstItem, 'First item should exist');
      assert.strictEqual(firstItem.from, 'sender@example.com');
    });

    it('handles missing subject (uses empty string)', () => {
      const emailWithoutSubject = { ...SAMPLE_EMAIL_SUMMARY };
      delete emailWithoutSubject.subject;
      const result = buildContentForItems([emailWithoutSubject]);
      const firstItem = result[0];
      assert.ok(firstItem, 'First item should exist');
      assert.strictEqual(firstItem.subject, '');
    });

    it('handles missing from (uses empty string)', () => {
      const emailWithoutFrom = { ...SAMPLE_EMAIL_SUMMARY };
      delete emailWithoutFrom.from;
      const result = buildContentForItems([emailWithoutFrom]);
      const firstItem = result[0];
      assert.ok(firstItem, 'First item should exist');
      assert.strictEqual(firstItem.from, '');
    });

    it('text property contains JSON representation', () => {
      const result = buildContentForItems([SAMPLE_EMAIL_SUMMARY]);
      const firstItem = result[0];
      assert.ok(firstItem, 'First item should exist');
      const text = firstItem.text;
      assert.strictEqual(typeof text, 'string');
      // Should be valid JSON
      const parsed = JSON.parse(text);
      assert.strictEqual(parsed.id, SAMPLE_EMAIL_SUMMARY.id);
    });

    it('handles email with unicode content', () => {
      const result = buildContentForItems([UNICODE_EMAIL]);
      const firstItem = result[0];
      assert.ok(firstItem, 'First item should exist');
      assert.strictEqual(firstItem.from, UNICODE_EMAIL.from);
      // JSON text should contain unicode
      assert.ok(firstItem.text.includes('José García'));
    });

    it('handles email with very long subject', () => {
      const result = buildContentForItems([LONG_EMAIL]);
      const firstItem = result[0];
      assert.ok(firstItem, 'First item should exist');
      assert.strictEqual(firstItem.subject, LONG_EMAIL.subject);
      assert.ok(firstItem.subject.length > 100);
    });
  });
});
