const assert = require('assert');
const { addressesToString, buildContentForItems, formatAddresses, normalizeDateToISO, stripHtml } = require('@mcp-z/email');

describe('exports .cjs', () => {
  it('named exports resolve', () => {
    for (const fn of [addressesToString, buildContentForItems, formatAddresses, normalizeDateToISO, stripHtml]) assert.equal(typeof fn, 'function');
  });
});
