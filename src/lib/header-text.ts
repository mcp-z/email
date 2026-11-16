import { z } from 'zod';

/** Character-class body for what must never reach a header line: C0 controls except tab, plus DEL (RFC 5322 §2.2 allows only printable ASCII, space and tab). https://www.rfc-editor.org/rfc/rfc5322#section-2.2 */
const UNSAFE_CLASS = '\\x00-\\x08\\x0A-\\x1F\\x7F';

export const HEADER_UNSAFE = new RegExp(`[${UNSAFE_CLASS}]`);

/** Schema for a string that becomes a header value. Rejects line breaks and other control characters (tab is allowed). */
export function headerText(description: string) {
  return z
    .string()
    .regex(new RegExp(`^[^${UNSAFE_CLASS}]*$`), 'must not contain line breaks or control characters (tab is allowed)')
    .describe(description);
}

/** Clean a header value taken from received mail: each run of forbidden characters becomes one space. */
export function sanitizeHeaderText(value: string): string {
  return value.replace(new RegExp(`[${UNSAFE_CLASS}]+`, 'g'), ' ');
}
