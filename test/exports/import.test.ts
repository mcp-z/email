import { addressesToString, buildContentForItems, formatAddresses, normalizeDateToISO, stripHtml } from '@mcp-z/email';
import assert from 'assert';

describe('exports .ts', () => {
  it('named exports resolve', () => {
    for (const fn of [addressesToString, buildContentForItems, formatAddresses, normalizeDateToISO, stripHtml]) assert.equal(typeof fn, 'function');
  });
});
