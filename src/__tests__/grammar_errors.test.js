/*
 * Grammar Error Tests
 *
 * Checks that our grammar will reject programs with various syntax errors.
 */


import syntaxCheck from '../syntax-checker.mjs';

const errors = [
  // ['keyword as id', 'if = 5;'],
  ['unclosed paren', 'x = (2 * 3;'],
  ['unknown operator', 'x = 2 ** 5;'],
  ['chained relational operators', 'a = 1 < 3 < 5;'],
  ['bad character in id', '$x = 1;'],
  // ['keyword in expression', 'x = while + 2;'],
  ['expression as statement', '9-2;'],
  // ['missing bracket', 'while true loop write 1;'],
  // ['missing loop', 'while false or true write 0; end;'],
  ['missing assignment', 'int x;'],
  ['missing expression', 'int x = ;'],
  ['empty program', ''],
  ['unknown type', 'var y = 5;'],
  ['unbalanced parentheses', 'a = 1 + (2 - 3));'],
];

describe('The syntax checker', () => {
  errors.forEach(([scenario, program]) => {
    test(`detects the error ${scenario}`, done => {
      expect(syntaxCheck(program)).toBe(false);
      done();
    });
  });
});
