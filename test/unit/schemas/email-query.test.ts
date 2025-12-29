import assert from 'assert';

import { z } from 'zod';
import { baseEmailQueryFields, FieldOperatorSchema } from '../../../src/schemas/email-query.ts';
import { QUERY_SAMPLES } from '../../lib/test-data.ts';

describe('email-query', () => {
  describe('FieldOperatorSchema', () => {
    it('validates $any operator', () => {
      const result = FieldOperatorSchema.safeParse({ $any: ['alice@example.com', 'bob@example.com'] });
      assert.strictEqual(result.success, true);
    });

    it('validates $all operator', () => {
      const result = FieldOperatorSchema.safeParse({ $all: ['urgent', 'important'] });
      assert.strictEqual(result.success, true);
    });

    it('validates $none operator', () => {
      const result = FieldOperatorSchema.safeParse({ $none: ['spam'] });
      assert.strictEqual(result.success, true);
    });

    it('validates multiple operators together', () => {
      const result = FieldOperatorSchema.safeParse({ $all: ['urgent'], $none: ['spam'] });
      assert.strictEqual(result.success, true);
    });

    it('validates empty arrays', () => {
      const result = FieldOperatorSchema.safeParse({ $any: [] });
      assert.strictEqual(result.success, true);
    });

    it('rejects non-string array elements', () => {
      const result = FieldOperatorSchema.safeParse({ $any: [123, 'test'] });
      assert.strictEqual(result.success, false);
    });

    it('rejects non-array values', () => {
      const result = FieldOperatorSchema.safeParse({ $any: 'not-an-array' });
      assert.strictEqual(result.success, false);
    });
  });

  describe('baseEmailQueryFields composition', () => {
    // Create a test query schema using baseEmailQueryFields
    const TestQuerySchema = z.object({
      ...baseEmailQueryFields,
      // Add test-specific fields
      testField: z.string().optional(),
    });

    it('includes from field', () => {
      const result = TestQuerySchema.safeParse({ from: 'alice@example.com' });
      assert.strictEqual(result.success, true);
    });

    it('includes to field', () => {
      const result = TestQuerySchema.safeParse({ to: 'recipient@example.com' });
      assert.strictEqual(result.success, true);
    });

    it('includes subject field', () => {
      const result = TestQuerySchema.safeParse({ subject: 'invoice' });
      assert.strictEqual(result.success, true);
    });

    it('includes hasAttachment field', () => {
      const result = TestQuerySchema.safeParse({ hasAttachment: true });
      assert.strictEqual(result.success, true);
    });

    it('includes isRead field', () => {
      const result = TestQuerySchema.safeParse({ isRead: false });
      assert.strictEqual(result.success, true);
    });

    it('includes date range field', () => {
      const result = TestQuerySchema.safeParse({
        date: { $gte: '2024-01-01', $lt: '2024-02-01' },
      });
      assert.strictEqual(result.success, true);
    });

    it('allows from with FieldOperator', () => {
      const result = TestQuerySchema.safeParse({ from: { $any: ['alice', 'bob'] } });
      assert.strictEqual(result.success, true);
    });

    it('validates simple query from test data', () => {
      const result = TestQuerySchema.safeParse(QUERY_SAMPLES.simple);
      assert.strictEqual(result.success, true);
    });

    it('validates query with FieldOperator from test data', () => {
      const result = TestQuerySchema.safeParse(QUERY_SAMPLES.withFieldOperator);
      assert.strictEqual(result.success, true);
    });

    it('validates query with date range from test data', () => {
      const result = TestQuerySchema.safeParse(QUERY_SAMPLES.withDateRange);
      assert.strictEqual(result.success, true);
    });

    it('validates query with boolean flags from test data', () => {
      const result = TestQuerySchema.safeParse(QUERY_SAMPLES.withFlags);
      assert.strictEqual(result.success, true);
    });
  });

  describe('baseEmailQueryFields with logical operators', () => {
    // Create a base schema object from the fields
    const BaseEmailQuerySchema = z.object(baseEmailQueryFields);

    // Simulate provider schema with logical operators - recursive schema type
    type EmailQuery = z.infer<typeof BaseEmailQuerySchema> & {
      $and?: EmailQuery[];
      $or?: EmailQuery[];
      $not?: EmailQuery;
    };

    // Use double cast for recursive schema definition
    const ProviderQuerySchema = z.lazy(() =>
      z.object({
        ...baseEmailQueryFields,
        $and: z.array(ProviderQuerySchema).optional(),
        $or: z.array(ProviderQuerySchema).optional(),
        $not: ProviderQuerySchema.optional(),
      })
    ) as unknown as z.ZodType<EmailQuery>;

    it('validates simple query', () => {
      const result = ProviderQuerySchema.safeParse({ from: 'alice@example.com', subject: 'test' });
      assert.strictEqual(result.success, true);
    });

    it('validates $and operator with base fields', () => {
      const result = ProviderQuerySchema.safeParse({
        $and: [{ from: 'alice@example.com' }, { hasAttachment: true }],
      });
      assert.strictEqual(result.success, true);
    });

    it('validates nested $or inside $and', () => {
      const result = ProviderQuerySchema.safeParse({
        $and: [{ $or: [{ from: 'alice' }, { from: 'bob' }] }, { subject: 'invoice' }],
      });
      assert.strictEqual(result.success, true);
    });

    it('validates $not operator', () => {
      const result = ProviderQuerySchema.safeParse({ $not: { from: 'spam@example.com' } });
      assert.strictEqual(result.success, true);
    });

    it('validates complex nested query', () => {
      const result = ProviderQuerySchema.safeParse(QUERY_SAMPLES.complex);
      assert.strictEqual(result.success, true);
    });
  });
});
