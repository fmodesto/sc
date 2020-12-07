import parse from '../src/parser.js';

const errors = [
    ['keyword as id', 'if = 5;'],
    ['unclosed paren', 'x = (2 * 3;'],
    ['unknown operator', 'x = 2 ** 5;'],
    ['bad character in id', '$x = 1;'],
    ['keyword in expression', 'x = while + 2;'],
    ['expression as statement', '9-2;'],
    ['missing bracket', 'while (true) a += 3;'],
    ['missing hex value', 'x = 0x;'],
    ['missing expression', 'int x = ;'],
    ['unknown type', 'var y = 5;'],
    ['unbalanced parentheses', 'a = 1 + (2 - 3));'],
];

const valid = `
    char x = 3;
    char simple(char a, char b) {
        return a + b << 1;
    }
    char whileStmt(char a, char b) {
        char c;
        bool b;
        b = (int) c;
        c = 0x1;
        while (c) {
            b += foo(a, b);
            c <<= 1;
        }
        return b;
    }
    char ifStmt(char a, char b) {
        if (a) {
            return a;
        } else if (b) {
            return b;
        } else {
            return 0;
        }
    }
`;

describe('The syntax checker', () => {
    errors.forEach(([scenario, program]) => {
        test(`detects the error ${scenario}`, (done) => {
            expect(() => parse(program, 'Stmt')).toThrow();
            done();
        });
    });
});

describe('The syntax checker', () => {
    test('accepts the mega program with all syntactic forms', (done) => {
        expect(() => parse(valid)).not.toThrow();
        done();
    });
});
