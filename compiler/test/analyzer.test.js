import parse from '../src/parser.js';
import '../src/optimizer.js';
import '../src/analyzer.js';

const check = (src) => () => parse(src).analyze();

describe('Analyzer detect error programs', () => {
    test('Global must be constant', (done) => {
        let src = `
            char a = 2;
            char b = 5 * a;

            void foo() {}
        `;
        expect(check(src)).toThrow('Expression must have a constant value');
        done();
    });
    test('Global must match the type', (done) => {
        let src = `
            char a = true;

            void foo() {}
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert \'bool\' to \'char\'');
        done();
    });
    test('Duplicate global', (done) => {
        let src = `
            char a = 5;
            int a = 3;

            void foo() {}
        `;
        expect(check(src)).toThrow('Redefinition of \'a\'');
        done();
    });
    test.only('Duplicate register', (done) => {
        let src = `
            char a = 5;
            reg(7) char a;

            void foo() {}
        `;
        expect(check(src)).toThrow('Redefinition of \'a\'');
        done();
    });
    test('Duplicate method', (done) => {
        let src = `
            char foo() {
                return 0;
            }
            char foo(char a) {
                return 0;
            }
        `;
        expect(check(src)).toThrow('Redefinition of \'foo\'');
        done();
    });
    test('Redefinition', (done) => {
        let src = `
            int foo = 5;
            char foo(char a) {
                return 0;
            }
        `;
        expect(check(src)).toThrow('Redefinition of \'foo\'');
        done();
    });
    test('Duplicate parameter', (done) => {
        let src = `
            char foo(char a, char a) {
                return 0;
            }
        `;
        expect(check(src)).toThrow('Redefinition of \'a\'');
        done();
    });
    test('Duplicate local', (done) => {
        let src = `
            char foo(char a) {
                char a;
                return 0;
            }
        `;
        expect(check(src)).toThrow('Redefinition of \'a\'');
        done();
    });
    test('Assignment unknown variable', (done) => {
        let src = `
            char foo(char a) {
                b = 3;
                return 0;
            }
        `;
        expect(check(src)).toThrow('Variable \'b\' not defined');
        done();
    });
    test('Assignment type missmatch', (done) => {
        let src = `
            char foo(char a) {
                char b;
                b = 5 > a;
                return 0;
            }
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert \'bool\' to \'char\'');
        done();
    });
    test('Return value in void function', (done) => {
        let src = `
            void foo(int a) {
                return a;
            }
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert \'int\' to \'void\'');
        done();
    });
    test('Return void in void function', (done) => {
        let src = `
            void bar() {}
            void foo(char a) {
                return bar();
            }
        `;
        expect(check(src)).toThrow('Incompatible types: unexpected return value');
        done();
    });
    test('Use void function as expression', (done) => {
        let src = `
            void bar() {}
            void foo(char a) {
                a = bar();
            }
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert \'void\' to \'char\'');
        done();
    });
    test('Function shoudl return a value', (done) => {
        let src = `
            char foo() {
            }
        `;
        expect(check(src)).toThrow('Missing return statement');
        done();
    });
    test('Function shoudl return a value', (done) => {
        let src = `
            char foo() {
                if (1) {
                    return 5;
                }
            }
        `;
        expect(check(src)).toThrow('Missing return statement');
        done();
    });
    test('Function shoudl return a value', (done) => {
        let src = `
            char foo() {
                while (1) {
                }
            }
        `;
        expect(check(src)).toThrow('Missing return statement');
        done();
    });
    test('Function shoudl return a value', (done) => {
        let src = `
            char foo() {
                return;
            }
        `;
        expect(check(src)).toThrow('Missing return a value');
        done();
    });
    test('Ternary expression should yeld same type', (done) => {
        let src = `
            void bar() {}
            void foo() {
                char a;
                a = 6 + (1 ? bar() : 3);
            }
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert between \'void\' and \'char\'');
        done();
    });
    test('Binary expression should yeld same type', (done) => {
        let src = `
            void bar() {}
            void foo() {
                char a;
                a = bar() + 3;
            }
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert between \'void\' and \'char\'');
        done();
    });
    test('Arithmetic expression with bool', (done) => {
        let src = `
            void foo() {
                bool a;
                a = 5 + true;
            }
        `;
        expect(check(src)).toThrow('Invalid types for operation: \'char\' + \'bool\'');
        done();
    });
    test('Arithmetic expression with bools', (done) => {
        let src = `
            void foo() {
                bool a;
                a = false + true;
            }
        `;
        expect(check(src)).toThrow('Invalid types for operation: \'bool\' + \'bool\'');
        done();
    });
    test('Relational expression with bool', (done) => {
        let src = `
            void foo() {
                bool a;
                a = -5 < true;
            }
        `;
        expect(check(src)).toThrow('Invalid types for operation: \'char\' < \'bool\'');
        done();
    });
    test('Unary expression with bool', (done) => {
        let src = `
            void foo() {
                char a;
                a = ~true;
            }
        `;
        expect(check(src)).toThrow('Invalid type for operation: ~\'bool\'');
        done();
    });
    test('Call to undefined method', (done) => {
        let src = `
            void foo() {
                bar();
            }
        `;
        expect(check(src)).toThrow('Method \'bar\' not defined');
        done();
    });
    test('Call with wrong number of parameters', (done) => {
        let src = `
            void bar() {}
            void foo() {
                bar(1);
            }
        `;
        expect(check(src)).toThrow('Arity missmatch, expected 0 parameters but found 1');
        done();
    });
    test('Call with wrong type', (done) => {
        let src = `
            void bar(char a) {}
            void foo() {
                bar(true);
            }
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert \'bool\' to \'char\'');
        done();
    });
    test('Use undefined variable', (done) => {
        let src = `
            char foo() {
                return a;
            }
        `;
        expect(check(src)).toThrow('Variable \'a\' not defined');
        done();
    });
    test('Constant too long', (done) => {
        let src = `
            int foo(int a) {
                a = 32767;
                return 32768;
            }
        `;
        expect(check(src)).toThrow('Value 32768 exceeds \'int\'');
        done();
    });
    test('Constant too long', (done) => {
        let src = `
            int foo(int a) {
                a = 0x10000;
                return 32768;
            }
        `;
        expect(check(src)).toThrow('Value 65536 exceeds \'int\'');
        done();
    });
    test('Shift left by int amount', (done) => {
        let src = `
            int foo(int a) {
                return a << 1u;
            }
        `;
        expect(check(src)).toThrow('Invalid types for operation: \'int\' << \'int\'');
        done();
    });
    test('Shift right by int amount', (done) => {
        let src = `
            int foo(int a) {
                return a >> 1u;
            }
        `;
        expect(check(src)).toThrow('Invalid types for operation: \'int\' >> \'int\'');
        done();
    });
    test('Array init', (done) => {
        let src = `
            int a = 8;
            char a[2] = {1, 2};
            void test() {
            }
        `;
        expect(check(src)).toThrow('Redefinition of \'a\'');
        done();
    });
    test('Array too large', (done) => {
        let src = `
            char a[5][8][6] = {1, 2, 3};
            void test() {
            }
        `;
        expect(check(src)).toThrow('Array does\'t fit in memory \'a[5,8,8]\'');
        done();
    });
    test('Array length 0', (done) => {
        let src = `
            char a[0][3] = { 0 };
            void test() {
            }
        `;
        expect(check(src)).toThrow('Array with 0 length');
        done();
    });
    test('Array init', (done) => {
        let src = `
            char a[2] = {1, 2, 3};
            void test() {
            }
        `;
        expect(check(src)).toThrow('Array initialization doesn\'t match dimensions. Expected 2 found 3');
        done();
    });
    test('Array init', (done) => {
        let src = `
            char a[2][3] = {{1, 2, 3}, 4};
            void test() {
            }
        `;
        expect(check(src)).toThrow('Expecting array initialization');
        done();
    });
    test('Array init', (done) => {
        let src = `
            char a[2][3] = {{1, 2, 3}, {1, 2, {3}}};
            void test() {
            }
        `;
        expect(check(src)).toThrow('Expecting list of literals');
        done();
    });
    test('Array init', (done) => {
        let src = `
            char a[3] = {200, 5, 3};
            void test() {
            }
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert \'int\' to \'char\'');
        done();
    });
    test('Array init', (done) => {
        let src = `
            char a[3] = {-200, 120, 3};
            void test() {
            }
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert \'int\' to \'char\'');
        done();
    });
    test('Array init', (done) => {
        let src = `
            int a[4] = {-5u, -32000, -40000, 3};
            void test() {
            }
        `;
        expect(check(src)).toThrow('Value -40000 exceeds \'int\'');
        done();
    });
    test('Array access, wrong dimensions', (done) => {
        let src = `
            char a[3] = {1, -2, 3};
            void test() {
                char b;
                b = a[2][1];
            }
        `;
        expect(check(src)).toThrow('Array access doesn\'t match dimensions. Expected 1 found 2');
        done();
    });
    test('Array assignment, wrong dimensions', (done) => {
        let src = `
            char a[3] = {1, 2, 3};
            void test() {
                char b;
                a[2][1] = b;
            }
        `;
        expect(check(src)).toThrow('Array access doesn\'t match dimensions. Expected 1 found 2');
        done();
    });
    test('Array assignment, not defined', (done) => {
        let src = `
            void test() {
                a[2] = 5;
            }
        `;
        expect(check(src)).toThrow('Variable \'a\' not defined');
        done();
    });
    test('Array assignment, wrong type', (done) => {
        let src = `
            int a[7] = { 1,2,3,4,5,6,7 };
            void test() {
                a[2] = true;
            }
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert \'bool\' to \'int\'');
        done();
    });
    test('Array shortcut assignment, wrong dimensions', (done) => {
        let src = `
            char a[3] = {1, 2, 3};
            void test() {
                char b;
                a[2][1] += b;
            }
        `;
        expect(check(src)).toThrow('Array access doesn\'t match dimensions. Expected 1 found 2');
        done();
    });
    test('Array assignment, wrong index type', (done) => {
        let src = `
            char a[3] = {1, 2, 3};
            void test() {
                char b;
                a[2u] = b;
            }
        `;
        expect(check(src)).toThrow('Incompatible types: possible lossy conversion from \'int\' to \'char\'');
        done();
    });
    test('Array compound assignment, wrong index type', (done) => {
        let src = `
            char a[3] = {1, 2, 3};
            void test() {
                char b;
                a[2u] += b;
            }
        `;
        expect(check(src)).toThrow('Incompatible types: possible lossy conversion from \'int\' to \'char\'');
        done();
    });
    test('Array expression, wrong index type', (done) => {
        let src = `
            char a[3] = {1, 2, 3};
            void test() {
                char b;
                b = a[2u];
            }
        `;
        expect(check(src)).toThrow('Incompatible types: possible lossy conversion from \'int\' to \'char\'');
        done();
    });
});

describe('Analyzer correct programs', () => {
    test('Handles if without else', (done) => {
        let src = `
            char a = 2;

            void bar() {
            }
            void foo(char b) {
                if (!b) {
                    return;
                }
                bar();
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test('Handles joined if statements', (done) => {
        let src = `
            reg(0xFFF) char a;

            void foo(char b) {
                if (!b) {
                } else if (a == b) {
                } else {
                }
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test('Handles for statements', (done) => {
        let src = `
            char a = 2;

            void foo(char b) {
                int c;
                for (c = 3; c < 20; c += 1) {
                    b += 1;
                }
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test('Handles do while statements', (done) => {
        let src = `
            char a = 2;

            void foo(char b) {
                do {
                    b += 1;
                } while (b);
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test('Handles while statements', (done) => {
        let src = `
            char a = 2;

            void foo(char b) {
                while (b) {
                    b += 1;
                }
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test('Handles return statements', (done) => {
        let src = `
            char foo(char b) {
                if (b) {
                    return 1;
                } else {
                    return 0;
                }
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test('Handles ternary expression', (done) => {
        let src = `
            bool foo(char b) {
                return b ? 1 : false;
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });

    test('Handles bool assignment', (done) => {
        let src = `
            void foo(bool b) {
                b = 4 && 3;
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });

    test('Handles bool expressions', (done) => {
        let src = `
            void foo(bool b) {
                b &= true;
                b |= (bool) 5;
                b ^= false;
                b = b == true;
                b = b != false;
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test('Handles auto cast', (done) => {
        let src = `
            void bar(bool a) {}
            void foo() {
                bar(5);
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test('Handles cast', (done) => {
        let src = `
            void bar(bool a) {}
            void foo() {
                char c;
                int d;
                bar(false | (bool) 5);
                c = (char) true;
                d = c;
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test('Handles hexadecimal', (done) => {
        let src = `
            char foo() {
                int a;
                a = 0xffff;
                return 0xF0;
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test('Handles array', (done) => {
        let src = `
            char a[5] = { 1,2,3,4,5 };
            void swap(char l, char r) {
                char t;
                t = a[l];
                a[l] = a[r];
                a[r] = t;
                a[0] += 5;
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
});
