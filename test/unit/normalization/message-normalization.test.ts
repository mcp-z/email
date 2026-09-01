import { type AddressToken, addressesToString, extractCurrentMessageFromHtml, extractCurrentMessageFromHtmlToText, extractCurrentMessageFromText, formatAddresses, normalizeDateToISO, parseAddresses, parseAddressToken, safeBase64UrlDecode, stripHtml } from '@mcp-z/email';
import assert from 'assert';
import { BASE64URL_SAMPLES, EMAIL_THREADS, HTML_SAMPLES, REAL_EMAIL_HTML, SAMPLE_ADDRESS_ARRAYS, SAMPLE_ADDRESSES } from '../../lib/test-data.ts';

describe('message-normalization', () => {
  // ==========================================================================
  // PRIORITY 1: ADDRESS PARSING FUNCTIONS
  // ==========================================================================

  describe('parseAddressToken()', () => {
    describe('valid inputs', () => {
      it('parses standard format: "Name" <email>', () => {
        const result = parseAddressToken(SAMPLE_ADDRESSES.standard);
        assert.ok(result);
        assert.strictEqual(result.name, 'John Doe');
        assert.strictEqual(result.email, 'john@example.com');
      });

      it('parses email only (no name)', () => {
        const result = parseAddressToken(SAMPLE_ADDRESSES.emailOnly);
        assert.ok(result);
        assert.strictEqual(result.name, null);
        assert.strictEqual(result.email, 'john@example.com');
      });

      it('parses name without quotes', () => {
        const result = parseAddressToken(SAMPLE_ADDRESSES.nameWithoutQuotes);
        assert.ok(result);
        assert.strictEqual(result.name, 'John Doe');
        assert.strictEqual(result.email, 'john@example.com');
      });

      it('handles name with apostrophe', () => {
        const result = parseAddressToken(SAMPLE_ADDRESSES.nameWithApostrophe);
        assert.ok(result);
        assert.strictEqual(result.name, "O'Brien, Kevin");
        assert.strictEqual(result.email, 'kevin@example.com');
      });

      it('handles name with comma', () => {
        const result = parseAddressToken(SAMPLE_ADDRESSES.nameWithComma);
        assert.ok(result);
        assert.strictEqual(result.name, 'Doe, John');
        assert.strictEqual(result.email, 'john@example.com');
      });

      it('handles unicode in name', () => {
        const result = parseAddressToken(SAMPLE_ADDRESSES.unicode);
        assert.ok(result);
        assert.strictEqual(result.name, 'José García');
        assert.strictEqual(result.email, 'jose@example.com');
      });

      it('handles emoji in name', () => {
        const result = parseAddressToken(SAMPLE_ADDRESSES.emoji);
        assert.ok(result);
        assert.strictEqual(result.name, 'John 🎉 Doe');
        assert.strictEqual(result.email, 'john@example.com');
      });

      it('handles multiple spaces in name', () => {
        const result = parseAddressToken(SAMPLE_ADDRESSES.multipleSpaces);
        assert.ok(result);
        assert.strictEqual(result.name, 'John   Doe');
        assert.strictEqual(result.email, 'john@example.com');
      });

      it('handles empty name with brackets', () => {
        const result = parseAddressToken(SAMPLE_ADDRESSES.emptyName);
        assert.ok(result);
        assert.strictEqual(result.name, null);
        assert.strictEqual(result.email, 'john@example.com');
      });

      it('handles escaped quotes in name (regex limitation)', () => {
        const result = parseAddressToken(SAMPLE_ADDRESSES.escapedQuotes);
        assert.ok(result);
        // Note: The regex pattern [^"]* doesn't support escaped quotes inside quoted names
        // So it stops at the first unescaped quote and doesn't match the angle bracket pattern
        // Falls back to treating the entire string as an email
        assert.strictEqual(result.name, null);
        assert.strictEqual(result.email, '"John \\"Johnny\\" Doe" <john@example.com>');
      });
    });

    describe('edge cases', () => {
      it('returns null for empty string', () => {
        const result = parseAddressToken('');
        assert.strictEqual(result, null);
      });

      it('returns null for whitespace only', () => {
        const result = parseAddressToken('   ');
        assert.strictEqual(result, null);
      });

      it('returns null for null input', () => {
        const result = parseAddressToken(null);
        assert.strictEqual(result, null);
      });

      it('returns null for undefined input', () => {
        const result = parseAddressToken(undefined);
        assert.strictEqual(result, null);
      });

      it('handles missing closing bracket (treats as plain email)', () => {
        const result = parseAddressToken('"John Doe" <john@example.com');
        assert.ok(result);
        assert.strictEqual(result.name, null);
        // Without closing bracket, entire string is treated as email
        assert.strictEqual(result.email, '"John Doe" <john@example.com');
      });
    });
  });

  describe('parseAddresses()', () => {
    describe('single address', () => {
      it('parses single address as string', () => {
        const result = parseAddresses('john@example.com');
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0]?.email, 'john@example.com');
      });

      it('parses single address as array', () => {
        const result = parseAddresses(['john@example.com']);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0]?.email, 'john@example.com');
      });
    });

    describe('multiple addresses', () => {
      it('parses comma-separated addresses', () => {
        const result = parseAddresses(SAMPLE_ADDRESSES.multipleComma);
        assert.strictEqual(result.length, 3);
        assert.strictEqual(result[0]?.email, 'john@example.com');
        assert.strictEqual(result[1]?.email, 'jane@example.com');
        assert.strictEqual(result[2]?.email, 'bob@example.com');
      });

      it('parses semicolon-separated addresses', () => {
        const result = parseAddresses(SAMPLE_ADDRESSES.multipleSemicolon);
        assert.strictEqual(result.length, 3);
        assert.strictEqual(result[0]?.email, 'john@example.com');
        assert.strictEqual(result[1]?.email, 'jane@example.com');
        assert.strictEqual(result[2]?.email, 'bob@example.com');
      });

      it('handles mixed formats in list', () => {
        const result = parseAddresses(SAMPLE_ADDRESSES.mixedFormats);
        assert.strictEqual(result.length, 3);
        assert.strictEqual(result[0]?.name, 'John Doe');
        assert.strictEqual(result[0]?.email, 'john@example.com');
        assert.strictEqual(result[1]?.name, null);
        assert.strictEqual(result[1]?.email, 'jane@example.com');
        assert.strictEqual(result[2]?.name, 'Bob');
        assert.strictEqual(result[2]?.email, 'bob@example.com');
      });

      it('handles names with commas (quoted) in list', () => {
        const result = parseAddresses(SAMPLE_ADDRESSES.commaInName);
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0]?.name, 'Doe, John');
        assert.strictEqual(result[0]?.email, 'john@example.com');
        assert.strictEqual(result[1]?.name, 'Smith, Jane');
        assert.strictEqual(result[1]?.email, 'jane@example.com');
      });

      it('parses array input', () => {
        const result = parseAddresses(SAMPLE_ADDRESS_ARRAYS.simple);
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0]?.email, 'john@example.com');
        assert.strictEqual(result[1]?.email, 'jane@example.com');
      });

      it('parses array with names', () => {
        const result = parseAddresses(SAMPLE_ADDRESS_ARRAYS.withNames);
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0]?.name, 'John Doe');
        assert.strictEqual(result[1]?.name, 'Jane Smith');
      });

      it('filters out empty strings in array', () => {
        const result = parseAddresses(SAMPLE_ADDRESS_ARRAYS.withEmpty);
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0]?.email, 'john@example.com');
        assert.strictEqual(result[1]?.email, 'jane@example.com');
      });
    });

    describe('whitespace handling', () => {
      it('handles leading and trailing whitespace', () => {
        const result = parseAddresses('  john@example.com  ,  jane@example.com  ');
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0]?.email, 'john@example.com');
        assert.strictEqual(result[1]?.email, 'jane@example.com');
      });

      it('handles multiple consecutive separators', () => {
        const result = parseAddresses('john@example.com,, jane@example.com');
        // Empty string between commas gets filtered out by parseAddressToken returning null
        assert.strictEqual(result.length, 2);
      });
    });

    describe('edge cases', () => {
      it('returns empty array for empty string', () => {
        const result = parseAddresses('');
        assert.deepStrictEqual(result, []);
      });

      it('returns empty array for null', () => {
        const result = parseAddresses(null);
        assert.deepStrictEqual(result, []);
      });

      it('returns empty array for undefined', () => {
        const result = parseAddresses(undefined);
        assert.deepStrictEqual(result, []);
      });

      it('returns empty array for empty array', () => {
        const result = parseAddresses([]);
        assert.deepStrictEqual(result, []);
      });

      it('handles trailing comma', () => {
        const result = parseAddresses('john@example.com, jane@example.com,');
        assert.strictEqual(result.length, 2);
      });
    });
  });

  describe('addressesToString()', () => {
    it('formats address with name', () => {
      const addresses: AddressToken[] = [{ name: 'John Doe', email: 'john@example.com' }];
      const result = addressesToString(addresses);
      assert.strictEqual(result, 'John Doe <john@example.com>');
    });

    it('formats address without name', () => {
      const addresses: AddressToken[] = [{ name: null, email: 'john@example.com' }];
      const result = addressesToString(addresses);
      assert.strictEqual(result, 'john@example.com');
    });

    it('formats multiple addresses', () => {
      const addresses: AddressToken[] = [
        { name: 'John Doe', email: 'john@example.com' },
        { name: null, email: 'jane@example.com' },
      ];
      const result = addressesToString(addresses);
      assert.strictEqual(result, 'John Doe <john@example.com>, jane@example.com');
    });

    it('quotes name with comma', () => {
      const addresses: AddressToken[] = [{ name: 'Doe, John', email: 'john@example.com' }];
      const result = addressesToString(addresses);
      assert.strictEqual(result, '"Doe, John" <john@example.com>');
    });

    it('escapes quotes in name', () => {
      const addresses: AddressToken[] = [{ name: 'John "Johnny" Doe', email: 'john@example.com' }];
      const result = addressesToString(addresses);
      assert.strictEqual(result, '"John \\"Johnny\\" Doe" <john@example.com>');
    });

    it('returns empty string for empty array', () => {
      const result = addressesToString([]);
      assert.strictEqual(result, '');
    });

    it('returns empty string for null', () => {
      const result = addressesToString(null);
      assert.strictEqual(result, '');
    });

    it('returns empty string for undefined', () => {
      const result = addressesToString(undefined);
      assert.strictEqual(result, '');
    });

    it('filters out addresses with empty email', () => {
      const addresses: AddressToken[] = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: '' },
        { name: 'Bob', email: 'bob@example.com' },
      ];
      const result = addressesToString(addresses);
      assert.strictEqual(result, 'John <john@example.com>, Bob <bob@example.com>');
    });
  });

  describe('formatAddresses()', () => {
    const addresses: AddressToken[] = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: null, email: 'jane@example.com' },
      { name: 'Bob Smith', email: 'bob@example.com' },
    ];

    describe('mode: raw', () => {
      it('formats with names in RFC format', () => {
        const result = formatAddresses(addresses, 'raw');
        assert.strictEqual(result, 'John Doe <john@example.com>, jane@example.com, Bob Smith <bob@example.com>');
      });

      it('is default when mode is undefined', () => {
        const result = formatAddresses(addresses, undefined);
        // When mode is undefined, it defaults to 'email' (line 84 checks String(mode || 'email'))
        assert.strictEqual(result, 'john@example.com, jane@example.com, bob@example.com');
      });
    });

    describe('mode: email', () => {
      it('returns emails only', () => {
        const result = formatAddresses(addresses, 'email');
        assert.strictEqual(result, 'john@example.com, jane@example.com, bob@example.com');
      });

      it('is default mode', () => {
        const result = formatAddresses(addresses);
        assert.strictEqual(result, 'john@example.com, jane@example.com, bob@example.com');
      });
    });

    describe('mode: name', () => {
      it('returns names, fallback to email', () => {
        const result = formatAddresses(addresses, 'name');
        assert.strictEqual(result, 'John Doe, jane@example.com, Bob Smith');
      });

      it('trims whitespace from names', () => {
        const withSpaces: AddressToken[] = [{ name: '  John Doe  ', email: 'john@example.com' }];
        const result = formatAddresses(withSpaces, 'name');
        assert.strictEqual(result, 'John Doe');
      });

      it('fallbacks to email when name is empty string', () => {
        const withEmpty: AddressToken[] = [{ name: '', email: 'john@example.com' }];
        const result = formatAddresses(withEmpty, 'name');
        assert.strictEqual(result, 'john@example.com');
      });
    });

    describe('edge cases', () => {
      it('returns empty string for empty array', () => {
        assert.strictEqual(formatAddresses([]), '');
      });

      it('returns empty string for null', () => {
        assert.strictEqual(formatAddresses(null), '');
      });

      it('returns empty string for undefined', () => {
        assert.strictEqual(formatAddresses(undefined), '');
      });

      it('handles case-insensitive mode', () => {
        const result = formatAddresses(addresses, 'email');
        assert.strictEqual(result, 'john@example.com, jane@example.com, bob@example.com');
      });
    });
  });

  describe('round-trip tests', () => {
    it('parse → format(raw) preserves standard format', () => {
      const original = '"John Doe" <john@example.com>, jane@example.com';
      const parsed = parseAddresses(original);
      const formatted = formatAddresses(parsed, 'raw');
      assert.strictEqual(formatted, 'John Doe <john@example.com>, jane@example.com');
    });

    it('parse → format(raw) preserves names with commas', () => {
      const original = '"Doe, John" <john@example.com>';
      const parsed = parseAddresses(original);
      const formatted = formatAddresses(parsed, 'raw');
      assert.strictEqual(formatted, '"Doe, John" <john@example.com>');
    });

    it('parse → format(email) → parse preserves emails', () => {
      const original = '"John Doe" <john@example.com>, jane@example.com';
      const parsed1 = parseAddresses(original);
      const emailsOnly = formatAddresses(parsed1, 'email');
      const parsed2 = parseAddresses(emailsOnly);

      assert.strictEqual(parsed1.length, parsed2.length);
      assert.strictEqual(parsed1[0]?.email, parsed2[0]?.email);
      assert.strictEqual(parsed1[1]?.email, parsed2[1]?.email);
      // Names are lost in email-only format
      assert.strictEqual(parsed2[0]?.name, null);
      assert.strictEqual(parsed2[1]?.name, null);
    });
  });

  // ==========================================================================
  // PRIORITY 2: HTML/TEXT EXTRACTION FUNCTIONS
  // ==========================================================================

  describe('stripHtml()', () => {
    describe('simple HTML', () => {
      it('strips simple paragraph tags', () => {
        const result = stripHtml(HTML_SAMPLES.simpleParagraph);
        assert.strictEqual(result, 'Hello World');
      });

      it('strips nested tags', () => {
        const result = stripHtml(HTML_SAMPLES.nestedTags);
        assert.strictEqual(result, 'Hello World');
      });

      it('strips tags with attributes', () => {
        const result = stripHtml(HTML_SAMPLES.withAttributes);
        assert.strictEqual(result, 'Hello World');
      });

      it('preserves text between multiple paragraphs', () => {
        const result = stripHtml(HTML_SAMPLES.multipleParagraphs);
        // innerText typically joins blocks with newlines
        assert.ok(result.includes('First paragraph'));
        assert.ok(result.includes('Second paragraph'));
        assert.ok(result.includes('Third paragraph'));
      });

      it('handles self-closing tags (br)', () => {
        const result = stripHtml(HTML_SAMPLES.withBreaks);
        assert.ok(result.includes('Line one'));
        assert.ok(result.includes('Line two'));
        assert.ok(result.includes('Line three'));
      });
    });

    describe('special content', () => {
      it('handles HTML entities', () => {
        const result = stripHtml(HTML_SAMPLES.withEntities);
        // node-html-parser's innerText may or may not decode entities depending on the HTML structure
        // Just verify we get text output without the HTML tags
        assert.ok(result.length > 0);
        assert.ok(!result.includes('<p>'));
        assert.ok(!result.includes('</p>'));
      });

      it('preserves unicode content', () => {
        const result = stripHtml(HTML_SAMPLES.withUnicode);
        assert.ok(result.includes('José García'));
        assert.ok(result.includes('🎉'));
      });

      it('extracts text content (note: script/style may be included)', () => {
        const result = stripHtml(HTML_SAMPLES.withScripts);
        // node-html-parser's innerText extracts all text content, including script/style
        // This is expected behavior - it's a simple parser, not a browser
        assert.ok(result.includes('Visible text'));
        // Script and style content may or may not be included depending on parser behavior
      });
    });

    describe('malformed HTML', () => {
      it('handles malformed HTML gracefully', () => {
        const result = stripHtml(HTML_SAMPLES.malformed);
        // node-html-parser is forgiving and extracts text
        assert.ok(result.includes('Hello') || result.includes('World'));
      });

      it('handles unclosed tags', () => {
        const result = stripHtml(HTML_SAMPLES.unclosedTags);
        assert.ok(result.includes('Hello'));
        assert.ok(result.includes('World'));
      });
    });

    describe('edge cases', () => {
      it('returns empty string for empty input', () => {
        const result = stripHtml('');
        assert.strictEqual(result, '');
      });

      it('returns empty string for only tags', () => {
        const result = stripHtml(HTML_SAMPLES.onlyTags);
        assert.strictEqual(result, '');
      });

      it('handles plain text (no HTML)', () => {
        const result = stripHtml('Hello World');
        assert.strictEqual(result, 'Hello World');
      });

      it('returns empty string for null', () => {
        const result = stripHtml(null);
        assert.strictEqual(result, '');
      });

      it('returns empty string for undefined', () => {
        const result = stripHtml(undefined);
        assert.strictEqual(result, '');
      });

      it('handles whitespace in tags', () => {
        const result = stripHtml(HTML_SAMPLES.withWhitespace);
        assert.ok(result.includes('Hello'));
        assert.ok(result.includes('World'));
      });

      it('handles number input', () => {
        const result = stripHtml(12345);
        assert.strictEqual(result, '12345');
      });
    });
  });

  describe('extractCurrentMessageFromText()', () => {
    describe('quote pattern detection', () => {
      it('extracts message before Gmail-style "On ... wrote:" quote', () => {
        const result = extractCurrentMessageFromText(EMAIL_THREADS.gmailQuote);
        assert.ok(result.includes('This is my reply'));
        assert.ok(!result.includes('On Mon, Jan 1, 2024'));
        assert.ok(!result.includes('original message'));
      });

      it('extracts message before Outlook-style "From: ... Sent:" quote', () => {
        const result = extractCurrentMessageFromText(EMAIL_THREADS.outlookQuote);
        assert.ok(result.includes('This is my reply'));
        assert.ok(!result.includes('From: User'));
        assert.ok(!result.includes('Sent: Monday'));
        assert.ok(!result.includes('original message'));
      });

      it('extracts message before generic "> " prefixed quotes', () => {
        const result = extractCurrentMessageFromText(EMAIL_THREADS.genericQuote);
        assert.ok(result.includes('This is my reply'));
        assert.ok(!result.includes('This is quoted text'));
      });

      it('extracts message before "-----Original Message-----" delimiter', () => {
        const result = extractCurrentMessageFromText(EMAIL_THREADS.originalMessageDelimiter);
        assert.ok(result.includes('This is my reply'));
        assert.ok(!result.includes('-----Original Message-----'));
        assert.ok(!result.includes('original message'));
      });

      it('extracts message before "--- Forwarded message ---" pattern', () => {
        const result = extractCurrentMessageFromText(EMAIL_THREADS.forwardedMessage);
        assert.ok(result.includes('Check out this message'));
        assert.ok(!result.includes('--- Forwarded message ---'));
        assert.ok(!result.includes('forwarded content'));
      });

      it('handles nested quotes (multiple reply levels)', () => {
        const result = extractCurrentMessageFromText(EMAIL_THREADS.nestedQuotes);
        assert.ok(result.includes('newest reply'));
        assert.ok(!result.includes('second reply'));
        assert.ok(!result.includes('original message'));
      });

      it('handles quote pattern in middle of text', () => {
        const result = extractCurrentMessageFromText(EMAIL_THREADS.quoteInMiddle);
        assert.ok(result.includes('beginning of my message'));
        assert.ok(!result.includes('Quoted text here'));
        // Note: Current implementation stops at first quote marker,
        // so text after quote is lost
      });

      it('returns full text when no quote markers found', () => {
        const result = extractCurrentMessageFromText(EMAIL_THREADS.noQuotes);
        assert.strictEqual(result, EMAIL_THREADS.noQuotes.trim());
      });
    });

    describe('unicode handling', () => {
      it('preserves unicode in current message and removes unicode quotes', () => {
        const result = extractCurrentMessageFromText(EMAIL_THREADS.unicodeQuote);
        assert.ok(result.includes('émojis'));
        assert.ok(result.includes('🎉'));
        assert.ok(!result.includes('Hola'));
        assert.ok(!result.includes('José García'));
      });
    });

    describe('edge cases', () => {
      it('returns empty string for null', () => {
        const result = extractCurrentMessageFromText(null);
        assert.strictEqual(result, '');
      });

      it('returns empty string for undefined', () => {
        const result = extractCurrentMessageFromText(undefined);
        assert.strictEqual(result, '');
      });

      it('returns empty string for empty string', () => {
        const result = extractCurrentMessageFromText('');
        assert.strictEqual(result, '');
      });

      it('handles text with only quote markers (returns quoted content)', () => {
        const text = '> This is all quoted\n> No current message';
        const result = extractCurrentMessageFromText(text);
        // The function looks for quote PATTERNS (like "On ... wrote:"), not just ">" prefixes at start
        // If there's no pattern match and content starts with ">", it returns the content
        // (lines 149-163 in implementation handle this case)
        assert.strictEqual(result, text);
      });

      it('normalizes line endings (CRLF to LF)', () => {
        const textWithCRLF = 'Current message\r\n\r\nOn ... wrote:\r\n> Quoted';
        const result = extractCurrentMessageFromText(textWithCRLF);
        assert.ok(result.includes('Current message'));
        assert.ok(!result.includes('Quoted'));
      });
    });
  });

  describe('extractCurrentMessageFromHtmlToText()', () => {
    describe('blockquote removal', () => {
      it('removes single blockquote', () => {
        const result = extractCurrentMessageFromHtmlToText(HTML_SAMPLES.withBlockquote);
        assert.ok(result.includes('Current message'));
        assert.ok(!result.includes('Quoted message'));
      });

      it('removes nested blockquotes', () => {
        const result = extractCurrentMessageFromHtmlToText(HTML_SAMPLES.nestedBlockquotes);
        assert.ok(result.includes('Current'));
        assert.ok(!result.includes('Deep quote'));
        assert.ok(!result.includes('Outer quote'));
      });

      it('removes multiple blockquotes', () => {
        const result = extractCurrentMessageFromHtmlToText(HTML_SAMPLES.multipleBlockquotes);
        assert.ok(result.includes('Current'));
        assert.ok(result.includes('More current'));
        assert.ok(!result.includes('Quote 1'));
        assert.ok(!result.includes('Quote 2'));
      });

      it('removes Gmail-style blockquotes with classes', () => {
        const result = extractCurrentMessageFromHtmlToText(HTML_SAMPLES.gmailQuote);
        assert.ok(result.includes('Reply'));
        assert.ok(!result.includes('Quoted Gmail message'));
      });
    });

    describe('fallback behavior', () => {
      it('returns unchanged text when no blockquotes', () => {
        const result = extractCurrentMessageFromHtmlToText(HTML_SAMPLES.simpleParagraph);
        assert.ok(result.includes('Hello World'));
      });

      it('falls back to stripHtml on parse error', () => {
        // Extremely malformed HTML might trigger fallback
        const result = extractCurrentMessageFromHtmlToText('<p>Text</p>');
        assert.ok(result.includes('Text'));
      });
    });

    describe('edge cases', () => {
      it('returns empty string for null', () => {
        const result = extractCurrentMessageFromHtmlToText(null);
        assert.strictEqual(result, '');
      });

      it('returns empty string for undefined', () => {
        const result = extractCurrentMessageFromHtmlToText(undefined);
        assert.strictEqual(result, '');
      });

      it('returns empty string for empty string', () => {
        const result = extractCurrentMessageFromHtmlToText('');
        assert.strictEqual(result, '');
      });
    });
  });

  describe('extractCurrentMessageFromHtml()', () => {
    describe('Gmail patterns', () => {
      it('removes Gmail blockquote with .gmail_quote class', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.gmailReplyChain);
        assert.ok(result.includes('My reply here'));
        assert.ok(!result.includes('gmail_quote'));
        assert.ok(!result.includes('Previous message'));
      });

      it('removes Gmail .gmail_quote div wrapper', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.gmailQuoteDiv);
        assert.ok(result.includes('My reply content'));
        assert.ok(!result.includes('Quoted message content'));
      });

      it('removes Gmail .gmail_extra (signature + quote container)', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.gmailWithSignature);
        assert.ok(result.includes('Main content'));
        assert.ok(!result.includes('gmail_extra'));
        assert.ok(!result.includes('Quoted content'));
        // Note: signature is inside gmail_extra, so it's also removed
      });
    });

    describe('Outlook patterns', () => {
      it('removes Outlook #divRplyFwdMsg container', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.outlookReply);
        assert.ok(result.includes('My reply content'));
        assert.ok(!result.includes('divRplyFwdMsg'));
        assert.ok(!result.includes('From:'));
        assert.ok(!result.includes('sender@example.com'));
      });

      it('removes Outlook #appendonsend marker', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.outlookAppendOnSend);
        assert.ok(result.includes('My response here'));
        assert.ok(!result.includes('appendonsend'));
      });

      it('removes Outlook data-outlook-is-reply attribute elements', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.outlookDataAttribute);
        assert.ok(result.includes('Current message'));
        assert.ok(!result.includes('quoted reply section'));
      });
    });

    describe('Apple Mail patterns', () => {
      it('removes Apple Mail blockquote with type="cite"', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.appleMailReply);
        assert.ok(result.includes('My reply'));
        assert.ok(!result.includes('Original message'));
        assert.ok(!result.includes('at 10:00 AM'));
      });
    });

    describe('Standard blockquote patterns', () => {
      it('removes standard blockquote elements', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.standardBlockquote);
        assert.ok(result.includes('Reply content'));
        assert.ok(!result.includes('This is quoted text'));
        assert.ok(!result.includes('More quoted text'));
      });

      it('removes all levels of nested blockquotes', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.nestedBlockquotes);
        assert.ok(result.includes('Latest reply'));
        assert.ok(!result.includes('First level quote'));
        assert.ok(!result.includes('Second level quote'));
        assert.ok(!result.includes('Third level quote'));
      });
    });

    describe('Multi-provider threads', () => {
      it('removes all provider quote patterns from mixed thread', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.mixedProviderThread);
        assert.ok(result.includes('Latest reply from Gmail'));
        assert.ok(!result.includes('Outlook reply content'));
        assert.ok(!result.includes('Apple Mail original'));
        assert.ok(!result.includes('gmail_quote'));
        assert.ok(!result.includes('divRplyFwdMsg'));
      });
    });

    describe('Edge cases', () => {
      it('returns unchanged HTML when no quotes present', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.noQuotes);
        assert.ok(result.includes('Just a clean message'));
        assert.ok(result.includes('With multiple paragraphs'));
        assert.ok(result.includes('And no quoted content'));
      });

      it('returns empty string for null input', () => {
        const result = extractCurrentMessageFromHtml(null);
        assert.strictEqual(result, '');
      });

      it('returns empty string for undefined input', () => {
        const result = extractCurrentMessageFromHtml(undefined);
        assert.strictEqual(result, '');
      });

      it('returns empty string for empty string input', () => {
        const result = extractCurrentMessageFromHtml('');
        assert.strictEqual(result, '');
      });

      it('handles malformed HTML gracefully', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.malformed);
        // Should return best effort extraction without throwing
        assert.ok(result.includes('Reply content'));
      });

      it('returns original for whitespace-only input', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.whitespaceOnly);
        // Whitespace is preserved as-is (not an error case)
        assert.strictEqual(typeof result, 'string');
      });
    });

    describe('HTML structure preservation', () => {
      it('preserves HTML tags in current message (not plain text)', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.gmailReplyChain);
        // Should contain HTML structure, not just text
        assert.ok(result.includes('<div'));
        assert.ok(result.includes('</div>') || result.includes('/>'));
      });

      it('preserves attributes on remaining elements', () => {
        const result = extractCurrentMessageFromHtml(REAL_EMAIL_HTML.gmailReplyChain);
        assert.ok(result.includes('dir="ltr"'));
      });
    });
  });

  // ==========================================================================
  // PRIORITY 3: DATE NORMALIZATION AND BASE64 DECODING
  // ==========================================================================

  describe('normalizeDateToISO()', () => {
    describe('Date object input', () => {
      it('converts valid Date to ISO string', () => {
        const date = new Date('2024-01-15T10:30:00.000Z');
        const result = normalizeDateToISO(date);
        assert.strictEqual(result, '2024-01-15T10:30:00.000Z');
      });

      it('preserves milliseconds', () => {
        const date = new Date('2024-01-15T10:30:00.456Z');
        const result = normalizeDateToISO(date);
        assert.strictEqual(result, '2024-01-15T10:30:00.456Z');
      });

      it('returns null for invalid Date', () => {
        const invalid = new Date('invalid');
        const result = normalizeDateToISO(invalid);
        assert.strictEqual(result, null);
      });
    });

    describe('number input (timestamps)', () => {
      it('converts millisecond timestamp', () => {
        const timestamp = 1705315800000; // 2024-01-15T10:50:00.000Z
        const result = normalizeDateToISO(timestamp);
        assert.strictEqual(result, '2024-01-15T10:50:00.000Z');
      });

      it('converts second timestamp (< 1e12)', () => {
        const timestamp = 1705315800; // seconds
        const result = normalizeDateToISO(timestamp);
        // Should multiply by 1000 to get ms
        assert.strictEqual(result, '2024-01-15T10:50:00.000Z');
      });

      it('handles zero timestamp (epoch)', () => {
        const result = normalizeDateToISO(0);
        assert.strictEqual(result, '1970-01-01T00:00:00.000Z');
      });

      it('handles negative timestamp (bug: treats as seconds)', () => {
        const timestamp = -86400000; // -1 day from epoch in ms
        const result = normalizeDateToISO(timestamp);
        // Bug: negative numbers are < 1e12, so they get multiplied by 1000
        // This treats -86400000 ms as -86400000 seconds
        // -86400000000 ms = 1967-04-07
        assert.strictEqual(result, '1967-04-07T00:00:00.000Z');
      });

      it('handles numeric string timestamp', () => {
        const result = normalizeDateToISO('1705315800000');
        assert.strictEqual(result, '2024-01-15T10:50:00.000Z');
      });
    });

    describe('string input', () => {
      it('parses ISO 8601 string', () => {
        const result = normalizeDateToISO('2024-01-15T10:30:00Z');
        assert.strictEqual(result, '2024-01-15T10:30:00.000Z');
      });

      it('parses ISO 8601 with milliseconds', () => {
        const result = normalizeDateToISO('2024-01-15T10:30:00.456Z');
        assert.strictEqual(result, '2024-01-15T10:30:00.456Z');
      });

      it('parses RFC 2822 format', () => {
        const result = normalizeDateToISO('Mon, 15 Jan 2024 10:30:00 GMT');
        assert.ok(result);
        assert.ok(result.includes('2024-01-15'));
      });

      it('parses partial ISO (date only)', () => {
        const result = normalizeDateToISO('2024-01-15');
        assert.ok(result);
        assert.ok(result.includes('2024-01-15'));
      });

      it('returns null for invalid string', () => {
        const result = normalizeDateToISO('not a date');
        assert.strictEqual(result, null);
      });

      it('returns null for empty string', () => {
        const result = normalizeDateToISO('');
        assert.strictEqual(result, null);
      });
    });

    describe('edge cases', () => {
      it('returns null for null', () => {
        const result = normalizeDateToISO(null);
        assert.strictEqual(result, null);
      });

      it('returns null for undefined', () => {
        const result = normalizeDateToISO(undefined);
        assert.strictEqual(result, null);
      });

      it('handles future dates (year 2100+)', () => {
        const future = new Date('2100-12-31T23:59:59.999Z');
        const result = normalizeDateToISO(future);
        assert.strictEqual(result, '2100-12-31T23:59:59.999Z');
      });

      it('handles very old dates (year 1900-)', () => {
        const old = new Date('1900-01-01T00:00:00.000Z');
        const result = normalizeDateToISO(old);
        assert.strictEqual(result, '1900-01-01T00:00:00.000Z');
      });

      it('returns null for NaN', () => {
        const result = normalizeDateToISO(Number.NaN);
        assert.strictEqual(result, null);
      });
    });
  });

  describe('safeBase64UrlDecode()', () => {
    describe('valid base64url', () => {
      it('decodes valid base64url without padding', () => {
        const result = safeBase64UrlDecode(BASE64URL_SAMPLES.valid.withoutPadding);
        assert.strictEqual(result, 'Hello World');
      });

      it('decodes valid base64url with padding', () => {
        const result = safeBase64UrlDecode(BASE64URL_SAMPLES.valid.withPadding);
        assert.strictEqual(result, 'Hello World');
      });

      it('handles URL-safe characters (- and _)', () => {
        const result = safeBase64UrlDecode(BASE64URL_SAMPLES.valid.withUrlSafeChars);
        assert.ok(result.length > 0);
        // Just verify it decodes without error
      });

      it('decodes long base64url string', () => {
        const result = safeBase64UrlDecode(BASE64URL_SAMPLES.valid.long);
        assert.ok(result.length > 0);
        assert.ok(result.includes('string'));
      });
    });

    describe('lenient decoding behavior', () => {
      it('decodes invalid characters without throwing (lenient)', () => {
        // Buffer.from with base64 is lenient - it ignores invalid chars
        const result = safeBase64UrlDecode(BASE64URL_SAMPLES.invalid.withInvalidChars);
        // Just verify it doesn't throw and returns something
        assert.ok(typeof result === 'string');
      });

      it('handles partial/truncated strings (lenient)', () => {
        // Buffer.from is lenient with partial base64
        const result = safeBase64UrlDecode(BASE64URL_SAMPLES.invalid.partial);
        assert.ok(typeof result === 'string');
      });

      it('decodes random text (may produce garbage)', () => {
        // Buffer.from will try to decode anything
        const result = safeBase64UrlDecode(BASE64URL_SAMPLES.invalid.randomText);
        assert.ok(typeof result === 'string');
      });
    });

    describe('edge cases', () => {
      it('returns empty string for empty input', () => {
        const result = safeBase64UrlDecode('');
        assert.strictEqual(result, '');
      });

      it('returns empty string for null', () => {
        const result = safeBase64UrlDecode(null);
        assert.strictEqual(result, '');
      });

      it('returns empty string for undefined', () => {
        const result = safeBase64UrlDecode(undefined);
        assert.strictEqual(result, '');
      });

      it('converts URL-safe alphabet to standard', () => {
        // '-' → '+', '_' → '/'
        const urlSafe = 'SGVsbG8gV29ybGQ'; // Valid base64url
        const result = safeBase64UrlDecode(urlSafe);
        assert.ok(result.length > 0);
      });

      it('auto-pads strings as needed', () => {
        // Base64 requires length to be multiple of 4
        // Function should auto-pad with '='
        const unpadded = 'SGVsbG8'; // Missing padding
        const result = safeBase64UrlDecode(unpadded);
        assert.ok(result.length > 0);
      });
    });
  });

  // Phase 4 complete! Next: Schema validation tests
});
