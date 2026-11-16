import { HEADER_UNSAFE, headerText, sanitizeHeaderText } from '@mcp-z/email';
import assert from 'assert';

describe('headerText()', () => {
  const schema = headerText('Message subject');

  for (const [label, value] of [
    ['CRLF', 'Hi\r\nBcc: x@example.com'],
    ['bare LF', 'Hi\nBcc: x@example.com'],
    ['bare CR', 'Hi\rBcc: x@example.com'],
    ['NUL', 'Hi\u0000there'],
    ['DEL', 'Hi\u007fthere'],
  ] as const) {
    it(`rejects ${label}`, () => {
      const result = schema.safeParse(value);
      assert.ok(!result.success);
      assert.ok(result.error.issues[0]?.message.includes('line breaks or control characters'));
    });
  }

  it('accepts tab and non-ASCII text', () => {
    assert.strictEqual(schema.parse('a\tb é — 日本語  '), 'a\tb é — 日本語  ');
  });

  it('keeps the description', () => {
    assert.strictEqual(schema.description, 'Message subject');
  });
});

describe('sanitizeHeaderText()', () => {
  it('turns each run of forbidden characters into one space', () => {
    assert.strictEqual(sanitizeHeaderText('Hi\r\nBcc: x'), 'Hi Bcc: x');
    assert.strictEqual(sanitizeHeaderText('a\r\n b'), 'a  b');
    assert.strictEqual(sanitizeHeaderText('a\n\n\r\u0000b'), 'a b');
  });

  it('leaves clean text, tab and non-ASCII unchanged', () => {
    assert.strictEqual(sanitizeHeaderText('a\tb é'), 'a\tb é');
  });

  it('removes everything HEADER_UNSAFE matches', () => {
    assert.ok(!HEADER_UNSAFE.test(sanitizeHeaderText('x\u0001\u001f\u007fy')));
  });
});
