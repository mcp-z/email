import { type HTMLElement, type Node, parse as parseHtml, TextNode } from 'node-html-parser';

/**
 * Represents a parsed email address with optional display name
 * @public
 */
export interface AddressToken {
  /** Display name (e.g., "John Doe" in "John Doe <john@example.com>") */
  name?: string | null | undefined;
  email: string;
}

export function parseAddressToken(token: string | undefined | null): AddressToken | null {
  const t = String(token ?? '').trim();
  if (!t) return null;
  const angleMatch = t.match(/^(?:"?([^"]*)"?\s*)?<([^>]+)>$/);
  if (angleMatch) {
    const name = (angleMatch[1] ?? '').trim() || null;
    const email = String(angleMatch[2] ?? '').trim();
    return { name, email };
  }
  return { name: null, email: t };
}

/**
 * Parse email address strings into structured AddressToken objects.
 * Handles comma and semicolon delimited lists with optional display names.
 *
 * @param addressInput - Email addresses as string or array
 * @returns Array of parsed address tokens
 * @see {@link AddressToken}
 * @public
 */
export function parseAddresses(addressInput: string | string[] | undefined | null): AddressToken[] {
  if (!addressInput) return [];
  let tokens: string[] = [];
  if (Array.isArray(addressInput)) {
    tokens = addressInput.flatMap((x) => String(x).split(/[,;]\s*/));
  } else if (typeof addressInput === 'string') {
    const parts: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < addressInput.length; i++) {
      const ch = addressInput[i] as string;
      if (ch === '"') {
        inQuotes = !inQuotes;
        cur += ch;
        continue;
      }
      if (!inQuotes && (ch === ',' || ch === ';')) {
        parts.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (cur) parts.push(cur);
    tokens = parts;
  } else {
    return [];
  }
  return tokens
    .map((t) => parseAddressToken(t))
    .filter((x): x is AddressToken => Boolean(x))
    .map(({ name, email }) => ({ name, email }));
}

export function addressesToString(addressArray: AddressToken[] | undefined | null): string {
  if (!Array.isArray(addressArray)) return '';
  return addressArray
    .map(({ name, email }) => {
      if (!email) return '';
      if (name) {
        const safeName = name.includes(',') || name.includes('"') ? `"${name.replace(/"/g, '\\"')}"` : name;
        return `${safeName} <${email}>`;
      }
      return email;
    })
    .filter(Boolean)
    .join(', ');
}

export function formatAddresses(addressArray: AddressToken[] | undefined | null, mode: 'raw' | 'email' | 'name' = 'email'): string {
  const m = String(mode || 'email').toLowerCase();
  if (!Array.isArray(addressArray)) return '';
  if (m === 'raw') return addressesToString(addressArray);
  if (m === 'name') {
    return addressArray
      .map(({ name, email }) => (name && String(name).trim() ? String(name).trim() : String(email ?? '').trim()))
      .filter(Boolean)
      .join(', ');
  }
  return addressArray
    .map(({ email }) => String(email ?? '').trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * Same text as `root.textContent`, walked with an explicit stack because the library's getters
 * recurse per nesting level and overflow the call stack on deeply nested HTML.
 *
 * @param skipTag - lowercase tag name whose subtrees are left out
 */
function textOfTree(root: HTMLElement, skipTag?: string): string {
  const parts: string[] = [];
  const stack: Node[] = [root];
  while (stack.length > 0) {
    const node = stack.pop() as Node;
    if (node.nodeType === 1) {
      const element = node as HTMLElement;
      if (skipTag && element !== root && element.rawTagName?.toLowerCase() === skipTag) continue;
      if (/^br$/i.test(element.rawTagName ?? '')) {
        parts.push('\n');
        continue;
      }
      for (let i = element.childNodes.length - 1; i >= 0; i--) stack.push(element.childNodes[i]);
    } else {
      parts.push(node.rawText);
    }
  }
  return new TextNode(parts.join(''), null).text;
}

export function stripHtml(html: string | number | null | undefined): string {
  if (html == null) return '';
  const text = textOfTree(parseHtml(String(html)));
  return text.replace(/\r\n?/g, '\n').trim();
}

export function normalizeDateToISO(value: string | number | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    if (Number.isFinite(t)) return new Date(t).toISOString();
    return null;
  }
  if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
    const n = Number(value);
    const ms = n < 1e12 ? n * 1000 : n;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    return null;
  }
  const parsed = Date.parse(String(value));
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return null;
}

export function safeBase64UrlDecode(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  try {
    return Buffer.from(s, 'base64').toString('utf8');
  } catch (_) {
    throw new Error('DECODE_FAILED');
  }
}

export function extractCurrentMessageFromText(text: string | null | undefined): string {
  if (text == null) return '';
  const s = String(text).replace(/\r\n?/g, '\n');
  const lines = s.split('\n');
  const patterns = [/^(?:on\s).+wrote:$/i, /^(?:on\s).+?at\s.+?,\s.*wrote:$/i, /^from:\s/i, /^sent:\s/i, /^to:\s/i, /^subject:\s/i, /^[-–—]{2,}\s*original message\s*[-–—]{2,}$/i, /^[-–—]{2,}\s*forwarded message\s*[-–—]{2,}$/i, /^begin forwarded message:?$/i, /^_{6,}$/];
  const normalize = (line: string) =>
    String(line)
      .replace(/^([>\s\t\u00A0\u202F\u2007\u2009]+)+/, '')
      .replace(/[\u00A0\u202F\u2007\u2009]/g, ' ')
      .trim();
  let cutIndex = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const norm = normalize(line);
    if (patterns.some((re) => re.test(norm))) {
      cutIndex = i;
      break;
    }
  }
  if (cutIndex === lines.length) {
    let seenContent = false;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i] ?? '';
      const trimmed = String(l).trim();
      if (trimmed.length === 0) continue;
      if (/^>+/.test(trimmed)) {
        if (seenContent) {
          cutIndex = i;
          break;
        }
      } else {
        seenContent = true;
      }
    }
  }
  const trimmed = lines.slice(0, cutIndex).join('\n').trim();
  return trimmed;
}

export function extractCurrentMessageFromHtmlToText(html: string | null | undefined): string {
  if (html == null) return '';
  // Quoted content is left out using the universal HTML semantic pattern
  const text = textOfTree(parseHtml(String(html)), 'blockquote');
  return extractCurrentMessageFromText(text);
}

/**
 * Provider-specific quote selectors for HTML email thread extraction.
 * These are semantic HTML patterns used by major email clients to wrap quoted content.
 */
const QUOTE_SELECTORS = [
  // Universal
  'blockquote',

  // Gmail
  '.gmail_quote',
  '.gmail_extra',

  // Outlook/Office 365
  '#appendonsend',
  '#divRplyFwdMsg',
  '[data-outlook-is-reply]',

  // Apple Mail - blockquote[type="cite"] already covered by 'blockquote'
] as const;

/**
 * Extract current message from HTML, removing thread history.
 * Unlike extractCurrentMessageFromHtmlToText, this preserves HTML structure.
 * Uses semantic HTML patterns rather than text-based regex matching.
 *
 * @param html - Raw HTML email content
 * @returns HTML string with quoted content removed
 */
export function extractCurrentMessageFromHtml(html: string | null | undefined): string {
  if (html == null) return '';
  try {
    const root = parseHtml(String(html));

    // Remove all provider-specific quote containers
    for (const selector of QUOTE_SELECTORS) {
      root.querySelectorAll(selector)?.forEach((el) => {
        el?.remove();
      });
    }

    return root.toString();
  } catch (_) {
    return html ?? '';
  }
}
