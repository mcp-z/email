# @mcp-z/email Architecture

> **Last Updated**: November 2025

## Overview

`@mcp-z/email` is a provider-agnostic email processing toolkit that provides schemas, query DSL foundations, and normalization utilities for building multi-provider email applications. The library deliberately avoids provider-specific logic, focusing instead on common patterns that Gmail, Outlook, and other email providers share.

**Design Philosophy**: Define shared foundations (base fields, operators, schemas) that providers extend rather than creating a framework that providers must adopt.

## Core Principles

### Provider-Agnostic Foundation

**Decision**: Library provides base building blocks, not provider-specific implementations.

**Rationale**:
- Providers have unique features (Gmail's fuzzyPhrase, Outlook's KQL, etc.)
- One shared library reduces duplication across email servers
- Clear separation between common patterns and provider specialization
- Easier to add new providers without changing the library

**What this means**:
- No Gmail or Outlook import dependencies
- No provider-specific query translation logic
- No API client code
- Pure data structures and utilities

### Object Spread Over Factory Functions

**Decision**: Providers spread `baseEmailQueryFields` object rather than calling factory functions.

**Rationale**:
- Simpler - just spread the object
- More transparent - can see exactly what's in each schema
- Less abstraction - no function call overhead
- More flexible - each provider controls its own `z.lazy()` closure

**Example**:
```typescript
// Library provides base fields as object
export const baseEmailQueryFields = {
  from: z.union([z.string(), FieldOperatorSchema]).optional(),
  to: z.union([z.string(), FieldOperatorSchema]).optional(),
  // ... other fields
};

// Providers spread into their own schemas
const GmailQuerySchema = z.lazy(() =>
  z.object({
    $and: z.array(GmailQuerySchema).optional(),
    ...baseEmailQueryFields,  // Spread base fields
    fuzzyPhrase: z.string().optional(),  // Gmail-specific
  })
);
```

### Explicit Over Magic

**Pattern**: Types and operators are explicit, no hidden behavior.

```typescript
// Explicit field operators
const query = {
  from: { $any: ['alice@example.com', 'bob@example.com'] }  // Clear OR logic
};

// NOT: Implicit array = OR
const query = {
  from: ['alice@example.com', 'bob@example.com']  // Unclear - is this OR or AND?
};
```

**Rationale**: Explicit operators make query semantics clear to both developers and AI assistants.

## Query DSL Architecture

### Base Email Query Fields

**Purpose**: Provide reusable foundation that all email providers share.

**Structure**:
```typescript
export const baseEmailQueryFields = {
  // Address fields - string or field operators
  from: z.union([z.string(), FieldOperatorSchema]).optional(),
  to: z.union([z.string(), FieldOperatorSchema]).optional(),
  cc: z.union([z.string(), FieldOperatorSchema]).optional(),
  bcc: z.union([z.string(), FieldOperatorSchema]).optional(),

  // Content search - string or field operators
  subject: z.union([z.string(), FieldOperatorSchema]).optional(),
  body: z.union([z.string(), FieldOperatorSchema]).optional(),
  text: z.union([z.string(), FieldOperatorSchema]).optional(),

  // Boolean filters
  hasAttachment: z.boolean().optional(),
  isRead: z.boolean().optional(),

  // Date range
  date: z.object({
    $gte: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    $lt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).optional(),
};

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
    $gte?: string;  // YYYY-MM-DD
    $lt?: string;   // YYYY-MM-DD
  };
};
```

**Design Decision**: Use `z.ZodRawShape` object (not function) for maximum flexibility.

**Benefits**:
- DRY Principle - Base fields defined once
- Simple - No factory functions or complex abstractions
- Flexible - Each provider controls its own recursive schema
- Type-Safe - Full TypeScript inference

### Field Operators (Within-Field Logic)

**Purpose**: Express OR/AND/NOT logic within a single field.

**Structure**:
```typescript
export const FieldOperatorSchema = z.object({
  $any: z.array(z.string()).optional(),   // OR - match ANY value
  $all: z.array(z.string()).optional(),   // AND - match ALL values
  $none: z.array(z.string()).optional(),  // NOT - match NONE
});

export type FieldOperator = {
  $any?: string[];   // Match if ANY value matches
  $all?: string[];   // Match if ALL values match
  $none?: string[];  // Match if NONE match
};
```

**Use Cases**:
```typescript
// OR within field - match emails from Alice OR Bob
{ from: { $any: ['alice@example.com', 'bob@example.com'] } }

// AND within field - match emails with ALL labels
{ label: { $all: ['work', 'important'] } }

// NOT within field - exclude spam and marketing
{ from: { $none: ['spam@example.com', 'marketing@company.com'] } }
```

**Why explicit operators?** Makes query semantics unambiguous for both developers and AI assistants parsing queries.

### Recursive Query Operators (Cross-Field Logic)

**Purpose**: Combine multiple conditions with AND/OR/NOT logic.

**Provider Responsibility**: Each provider adds recursive operators to their own schema.

**Pattern**:
```typescript
// Provider defines recursive schema with z.lazy()
export const GmailQuerySchema = z.lazy(() =>
  z.object({
    // Recursive operators (self-referential)
    $and: z.array(GmailQuerySchema).optional(),
    $or: z.array(GmailQuerySchema).optional(),
    $not: GmailQuerySchema.optional(),

    // Spread base fields
    ...baseEmailQueryFields,

    // Provider-specific fields
    fuzzyPhrase: z.string().optional(),
    categories: z.enum(['primary', 'social']).optional(),
  })
);

export type GmailQuery = BaseEmailQueryFields & {
  $and?: GmailQuery[];
  $or?: GmailQuery[];
  $not?: GmailQuery;
  fuzzyPhrase?: string;
  categories?: 'primary' | 'social' | 'promotions';
};
```

**Why providers define operators?** Recursive operators reference the provider's own schema type, not base type. Each provider needs its own `z.lazy()` closure.

### Why z.lazy() is Required

**Problem**: Zod schemas cannot reference themselves before initialization.

**Without z.lazy()** - ReferenceError:
```typescript
const BadSchema = z.object({
  $and: z.array(BadSchema).optional()  // ❌ ReferenceError!
});
```

**With z.lazy()** - Works:
```typescript
const GoodSchema = z.lazy(() =>
  z.object({
    $and: z.array(GoodSchema).optional()  // ✅ Works!
  })
);
```

**How z.lazy() works**: Wraps schema creation in a function that's called when first accessed, allowing the closure to capture the reference.

**Zod v3 Limitation**: Cannot use `.extend()` with `z.lazy()` schemas. Must use object spread instead:

```typescript
// WRONG - Zod v3 limitation
const Extended = BaseSchema.extend({ newField: z.string() });  // ❌ Cannot extend z.lazy()

// CORRECT - Use object spread
const Extended = z.lazy(() =>
  z.object({
    ...baseFields,  // Spread base fields
    newField: z.string()
  })
);
```

**MCP Compatibility**: `z.lazy()` works correctly with Model Context Protocol tool listing and schema serialization.

## Schema Normalization

### EmailSummary vs EmailDetail

**Purpose**: Two-tier schema for list view (summary) and detail view (full message).

**EmailSummary** (list view):
```typescript
export const EmailSummarySchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  subject: z.string(),
  date: z.string(),  // ISO 8601
  snippet: z.string(),
  isRead: z.boolean(),
  hasAttachment: z.boolean(),
  labels: z.array(z.string()),
});
```

**EmailDetail** (detail view):
```typescript
export const EmailDetailSchema = EmailSummarySchema.extend({
  cc: z.string().optional(),
  bcc: z.string().optional(),
  body: z.string(),           // Plain text body
  bodyHtml: z.string().optional(),  // HTML body
  attachments: z.array(AttachmentSchema).optional(),
});
```

**Design Decision**: Separate schemas for different use cases.

**Rationale**:
- List views don't need full message bodies (reduce bandwidth)
- Detail views need complete data including attachments
- Clear contract for what's available at each tier
- Providers can optimize API calls (list vs get)

### Provider Normalization Strategy

**Pattern**: Providers convert their native format to common schema.

**Example** (Gmail to EmailSummary):
```typescript
function normalizeGmailMessage(gmailMsg: any): EmailSummary {
  const headers = gmailMsg.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

  return EmailSummarySchema.parse({
    id: gmailMsg.id,
    from: getHeader('From') || '',
    to: getHeader('To') || '',
    subject: getHeader('Subject') || '',
    date: normalizeDateToISO(new Date(Number(gmailMsg.internalDate))),
    snippet: gmailMsg.snippet || '',
    isRead: !gmailMsg.labelIds?.includes('UNREAD'),
    hasAttachment: gmailMsg.labelIds?.includes('HAS_ATTACHMENT') || false,
    labels: gmailMsg.labelIds || []
  });
}
```

**Validation Strategy**: Use Zod's `.parse()` to validate normalized data.

**Benefits**:
- Type-safe normalization (TypeScript + Zod)
- Runtime validation catches provider API changes
- Consistent data structure across all tools
- Clear error messages when provider data is unexpected

## Normalization Utilities

### Address Parsing

**Purpose**: Convert RFC-compliant email address strings to structured objects.

**parseAddresses()**: String → Structured
```typescript
const raw = 'John Doe <john@example.com>, jane@example.com';
const parsed = parseAddresses(raw);
// [
//   { name: 'John Doe', address: 'john@example.com' },
//   { name: undefined, address: 'jane@example.com' }
// ]
```

**formatAddresses()**: Structured → String
```typescript
const addresses = [
  { name: 'John Doe', address: 'john@example.com' },
  { address: 'jane@example.com' }
];
const formatted = formatAddresses(addresses);
// 'John Doe <john@example.com>, jane@example.com'
```

**Implementation**: Uses `nodemailer/lib/addressparser` for RFC-compliant parsing.

**Why not custom parser?** RFC 5322 email address parsing is complex. Reuse battle-tested implementation.

### HTML Processing

**Purpose**: Extract clean text from HTML email bodies.

**stripHtml()**: Remove HTML tags
```typescript
const html = '<div>Hello <strong>World</strong>!</div>';
const text = stripHtml(html);  // 'Hello World!'
```

**extractCurrentMessageFromHtmlToText()**: Remove quoted replies
```typescript
const threadHtml = `
  <div>New message here</div>
  <blockquote>
    <div>Previous message...</div>
  </blockquote>
`;
const current = extractCurrentMessageFromHtmlToText(threadHtml);
// 'New message here'
```

**Implementation Strategy**:
1. Parse HTML to DOM (using html-to-text)
2. Remove `<blockquote>` elements (quoted replies)
3. Convert to plain text
4. Trim whitespace

**Why remove blockquotes?** Email threads nest previous messages in blockquotes. Current message is everything outside blockquotes.

## Design Constraints

### What the Library Does NOT Do

**No query translation** - Library doesn't convert queries to Gmail/Outlook/IMAP syntax

**No API clients** - No code for calling provider APIs

**No authentication** - No OAuth or credential management

**No provider-specific logic** - No Gmail fuzzyPhrase implementation or Outlook KQL generation

**No message sending** - Only processing and normalization, not sending

### What the Library Provides

**Base query fields** - Common fields all email providers share

**Field operators** - Within-field AND/OR/NOT logic

**Email schemas** - Normalized EmailSummary and EmailDetail

**Address parsing** - RFC-compliant email address handling

**HTML processing** - Extract text from HTML bodies and threads

**Date normalization** - Consistent ISO 8601 date formatting

## Architecture Trade-offs

### Provider Extension vs Base Implementation

**Choice**: Provide base fields for providers to extend, not base class to inherit from.

**Trade-off**: Providers write more code (recursive operators, query translation), but have full control.

**Example**: Gmail can add fuzzyPhrase, Outlook can add KQL, IMAP can add custom headers - all without changing library.

**Rationale**: Email providers are too diverse for one-size-fits-all abstraction. Better to provide building blocks.

### Object Spread vs Factory Function

**Choice**: Export `baseEmailQueryFields` as object, not factory function.

**Trade-off**: Slightly less encapsulation (providers see internal structure), but simpler and more transparent.

**Example**: Providers just spread `...baseEmailQueryFields` instead of calling `createQuerySchema(options)`.

**Rationale**: Zod v3 limitations with `.extend()` make factory functions awkward. Object spread is simpler and more idiomatic.

### Explicit Operators vs Implicit Arrays

**Choice**: Require explicit `$any`, `$all`, `$none` operators rather than treating arrays as implicit OR.

**Trade-off**: More verbose queries, but unambiguous semantics.

**Example**:
```typescript
// Explicit (current)
{ from: { $any: ['alice@example.com', 'bob@example.com'] } }

// Implicit (rejected)
{ from: ['alice@example.com', 'bob@example.com'] }  // Is this OR or AND?
```

**Rationale**: Explicit operators make query intent clear for both developers and AI assistants.

## References

- [RFC 5322 - Internet Message Format](https://tools.ietf.org/html/rfc5322)
- [Zod Documentation](https://zod.dev/)
- [@mcp-z/email README](README.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
