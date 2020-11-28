/*
 * Grammar Success Test
 *
 * These tests check that our grammar accepts a program that features all of
 * syntactic forms of the language.
 */


import syntaxCheck from '../syntax-checker.mjs';

const program = String.raw`
// This Iki program has close to all syntactic and semantic forms
int x = 0;
int y = 0;

x = x==x && !(y > 3) || x;
int y = 5 * 3;
y <<= 3;
int c = 1 + 2 - 3;
c = a << 2 << 1;
`;

describe('The syntax checker', () => {
  test('accepts the mega program with all syntactic forms', done => {
    expect(syntaxCheck(program)).toBe(true);
    done();
  });
});
