export { EMAIL_CHUNK_SIZE, EMAIL_MAX_BATCH_SIZE } from './lib/email-constants.ts';
export { buildContentForItems } from './lib/email-formatting.ts';
export { type AddressToken, addressesToString, extractCurrentMessageFromHtml, extractCurrentMessageFromHtmlToText, extractCurrentMessageFromText, formatAddresses, normalizeDateToISO, parseAddresses, parseAddressToken, safeBase64UrlDecode, stripHtml } from './normalization/message-normalization.ts';
export * from './schemas/index.ts';
export * from './types.ts';
