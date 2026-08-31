# @mcp-z/email

Docs: https://mcp-z.github.io/email Provider-agnostic email utilities for parsing, normalization, and query schemas.

## Common uses

- Normalize Gmail/Outlook messages to a shared shape
- Parse and format email addresses
- Build shared query schemas across providers
- Extract clean text from HTML threads

## Install

```bash
npm install @mcp-z/email
```

## Quick start

### Parse addresses

```ts
import { parseAddresses, formatAddresses } from '@mcp-z/email';

const parsed = parseAddresses('John Doe <john@example.com>, jane@example.com');
const formatted = formatAddresses(parsed);
```

### Base query fields

```ts
import { baseEmailQueryFields } from '@mcp-z/email';
import { z } from 'zod';

const QuerySchema = z.object({
  ...baseEmailQueryFields
});
```

## Examples by category

### Parsing and normalization

```ts
import { normalizeDateToISO, stripHtml } from '@mcp-z/email';

const iso = normalizeDateToISO('Wed, 11 Sep 2024 10:30:00 -0400');
const text = stripHtml('<div>Hello <b>World</b></div>');
```

### Thread extraction

```ts
import { extractCurrentMessageFromHtmlToText, extractCurrentMessageFromText } from '@mcp-z/email';

const textFromHtml = extractCurrentMessageFromHtmlToText('<div>New reply</div><blockquote>Old</blockquote>');
const textFromPlain = extractCurrentMessageFromText('New reply\n\n> Old message');
```

### Query schemas

```ts
import { baseEmailQueryFields, FieldOperatorSchema } from '@mcp-z/email';
import { z } from 'zod';

const QuerySchema = z.object({
  ...baseEmailQueryFields,
  label: FieldOperatorSchema.optional()
});
```

### Tool input schemas

```ts
import { ComposeContentTypeSchema, createEmailRecipientsSchema } from '@mcp-z/email';
import { z } from 'zod';

const InputSchema = z.object({
  to: createEmailRecipientsSchema('To recipients'),
  body: z.string().min(1),
  contentType: ComposeContentTypeSchema.optional()
});
```

### Response helpers

```ts
import { buildContentForItems } from '@mcp-z/email';

const content = buildContentForItems([{ id: '1', subject: 'Hello' }], 'emails');
```

## API overview

- Address helpers: `parseAddresses()`, `formatAddresses()`
- HTML/text helpers: `stripHtml()`, `extractCurrentMessageFromHtml()`, `extractCurrentMessageFromHtmlToText()`, `extractCurrentMessageFromText()`
- Date helpers: `normalizeDateToISO()`
- Query helpers: `baseEmailQueryFields`, `FieldOperatorSchema`, `EMAIL_FIELDS`, `EMAIL_FIELD_DESCRIPTIONS`, `EMAIL_COMMON_PATTERNS`
- Schemas: `EmailSummarySchema`, `EmailDetailSchema`, `EmailContentTypeSchema`, `ExcludeThreadHistorySchema`
- Tool helpers: `createEmailRecipientsSchema()`, `createMessageResultSchema()`, `ComposeContentTypeSchema`
- Content helpers: `buildContentForItems()`
- Utils: `safeBase64UrlDecode()`

## Requirements

- Node.js >= 22
