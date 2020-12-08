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
            char a = 3;

            void foo() {}
        `;
        expect(check(src)).toThrow('Variable \'a\' already defined');
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
        expect(check(src)).toThrow('Method \'foo\' already defined');
        done();
    });
    test('Duplicate parameter', (done) => {
        let src = `
            char foo(char a, char a) {
                return 0;
            }
        `;
        expect(check(src)).toThrow('Variable \'a\' already defined');
        done();
    });
    test('Duplicate local', (done) => {
        let src = `
            char foo(char a) {
                char a;
                return 0;
            }
        `;
        expect(check(src)).toThrow('Variable \'a\' already defined');
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
            void foo(char a) {
                return 5;
            }
        `;
        expect(check(src)).toThrow('Incompatible types: can not convert \'char\' to \'void\'');
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
        expect(check(src)).toThrow('Type missmatch. Can not convert \'bool\' to \'char\'');
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
});

describe('Analyzer correct programs', () => {
    test('Handles if without else', (done) => {
        let src = `
            char a = 2;

            void bar() {
            }
            void foo(char b) {
                while (0) {}
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
            char a = 2;

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
                bar(false | (bool) 5);
                c = (char) true;
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
});
