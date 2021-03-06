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
    int array[2][3] = {
        {1, 2, 3},
        {4, 5, 6}
    };
    char simple(char a, char b) {
        return a + b << 1;
    }
    char forStmt(char a, char b) {
        char c, d;
        for (c = 1, d = 30; c < d; c += 1, d -= 1) {
            a -= b;
        }
        return (char) array[1][b];
    }
    char doStmt(char a, char b) {
        char c;
        bool b;
        b = (int) c;
        c = 0x1;
        do {
            b += foo(a, b);
            c <<= 1;
        } while (c);
        return (char) array[1][b];
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
        return (char) array[1][b];
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
