// Standalone regression of boundary validation proposed for the email controller.
// No network, secrets, Supabase or production code imported.
import test from 'node:test';
import assert from 'node:assert/strict';

const bytes = (value) => new TextEncoder().encode(value).byteLength;
const validRecoveryPassword = (value) =>
  typeof value === 'string' && value.length >= 8 &&
  value.length <= 128 && bytes(value) <= 72;

test('ASCII 8 and 72 accepted; 7, 73 and 129 rejected', () => {
  for (const n of [8, 72]) assert.equal(validRecoveryPassword('a'.repeat(n)), true);
  for (const n of [7, 73, 129]) assert.equal(validRecoveryPassword('a'.repeat(n)), false);
});
test('UTF-8 multi-byte boundary: 24 euro chars 72 bytes; 25 are 75', () => {
  assert.equal(bytes('€'.repeat(24)), 72);
  assert.equal(validRecoveryPassword('€'.repeat(24)), true);
  assert.equal(validRecoveryPassword('€'.repeat(25)), false);
});
test('JS UTF-16 length and Unicode code points differ', () => {
  assert.equal(validRecoveryPassword('😀'.repeat(8)), true);
  assert.equal(validRecoveryPassword('😀'.repeat(19)), false);
});
test('null, undefined and non-string input rejected', () => {
  for (const v of [null, undefined, 123, {}, []]) assert.equal(validRecoveryPassword(v), false);
});
