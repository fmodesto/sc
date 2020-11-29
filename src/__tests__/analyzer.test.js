import parse from '../parser.mjs';
import '../optimizer.mjs';
import '../analyzer.mjs';

const check = src => () => parse(src).analyze();

describe('Analyzer detect error programs', () => {
    test(`Global must be constant`, done => {
        let src = `
            byte a = 2;
            byte b = 5 * a;

            void foo() {}
        `;
        expect(check(src)).toThrow(`Expression must have a constant value`);
        done();
    });
    test(`Global must match the type`, done => {
        let src = `
            byte a = true;

            void foo() {}
        `;
        expect(check(src)).toThrow(`Incompatible types: can not convert 'bool' to 'byte'`);
        done();
    });
    test(`Duplicate global`, done => {
        let src = `
            byte a = 5;
            byte a = 3;

            void foo() {}
        `;
        expect(check(src)).toThrow(`Variable 'a' already defined`);
        done();
    });
    test(`Duplicate method`, done => {
        let src = `
            byte foo() {
                return 0;
            }
            byte foo(byte a) {
                return 0;
            }
        `;
        expect(check(src)).toThrow(`Method 'foo' already defined`);
        done();
    });
    test(`Duplicate parameter`, done => {
        let src = `
            byte foo(byte a, byte a) {
                return 0;
            }
        `;
        expect(check(src)).toThrow(`Variable 'a' already defined`);
        done();
    });
    test(`Duplicate local`, done => {
        let src = `
            byte foo(byte a) {
                byte a;
                return 0;
            }
        `;
        expect(check(src)).toThrow(`Variable 'a' already defined`);
        done();
    });
    test(`Assignment unknown variable`, done => {
        let src = `
            byte foo(byte a) {
                b = 3;
                return 0;
            }
        `;
        expect(check(src)).toThrow(`Variable 'b' not defined`);
        done();
    });
    test(`Assignment type missmatch`, done => {
        let src = `
            byte foo(byte a) {
                byte b;
                b = 5 > a;
                return 0;
            }
        `;
        expect(check(src)).toThrow(`Incompatible types: can not convert 'bool' to 'byte'`);
        done();
    });
    test(`Return value in void function`, done => {
        let src = `
            void foo(byte a) {
                return 5;
            }
        `;
        expect(check(src)).toThrow(`Incompatible types: can not convert 'byte' to 'void'`);
        done();
    });
    test(`Return void in void function`, done => {
        let src = `
            void bar() {}
            void foo(byte a) {
                return bar();
            }
        `;
        expect(check(src)).toThrow(`Incompatible types: unexpected return value`);
        done();
    });
    test(`Use void function as expression`, done => {
        let src = `
            void bar() {}
            void foo(byte a) {
                a = bar();
            }
        `;
        expect(check(src)).toThrow(`Incompatible types: can not convert 'void' to 'byte'`);
        done();
    });
    test(`Function shoudl return a value`, done => {
        let src = `
            byte foo() {
            }
        `;
        expect(check(src)).toThrow(`Missing return statement`);
        done();
    });
    test(`Function shoudl return a value`, done => {
        let src = `
            byte foo() {
                if (1) {
                    return 5;
                }
            }
        `;
        expect(check(src)).toThrow(`Missing return statement`);
        done();
    });
    test(`Function shoudl return a value`, done => {
        let src = `
            byte foo() {
                while (1) {
                }
            }
        `;
        expect(check(src)).toThrow(`Missing return statement`);
        done();
    });
    test(`Function shoudl return a value`, done => {
        let src = `
            byte foo() {
                return;
            }
        `;
        expect(check(src)).toThrow(`Missing return a value`);
        done();
    });
    test(`Ternary expression should yeld same type`, done => {
        let src = `
            void bar() {}
            void foo() {
                byte a;
                a = 6 + (1 ? bar() : 3);
            }
        `;
        expect(check(src)).toThrow(`Incompatible types: can not convert between 'void' and 'byte'`);
        done();
    });
    test(`Binary expression should yeld same type`, done => {
        let src = `
            void bar() {}
            void foo() {
                byte a;
                a = bar() + 3;
            }
        `;
        expect(check(src)).toThrow(`Incompatible types: can not convert between 'void' and 'byte'`);
        done();
    });
    test(`Arithmetic expression with bool`, done => {
        let src = `
            void foo() {
                bool a;
                a = 5 + true;
            }
        `;
        expect(check(src)).toThrow(`Invalid types for operation: 'byte' + 'bool'`);
        done();
    });
    test(`Relational expression with bool`, done => {
        let src = `
            void foo() {
                bool a;
                a = -5 < true;
            }
        `;
        expect(check(src)).toThrow(`Invalid types for operation: 'byte' < 'bool'`);
        done();
    });
    test(`Unary expression with bool`, done => {
        let src = `
            void foo() {
                byte a;
                a = ~true;
            }
        `;
        expect(check(src)).toThrow(`Invalid type for operation: ~'bool'`);
        done();
    });
    test(`Call to undefined method`, done => {
        let src = `
            void foo() {
                bar();
            }
        `;
        expect(check(src)).toThrow(`Method 'bar' not defined`);
        done();
    });
    test(`Call with wrong number of parameters`, done => {
        let src = `
            void bar() {}
            void foo() {
                bar(1);
            }
        `;
        expect(check(src)).toThrow(`Arity missmatch, expected 0 parameters but found 1`);
        done();
    });
    test(`Call with wrong type`, done => {
        let src = `
            void bar(byte a) {}
            void foo() {
                bar(true);
            }
        `;
        expect(check(src)).toThrow(`Type missmatch. Can not convert 'bool' to 'byte'`);
        done();
    });
    test(`Use undefined variable`, done => {
        let src = `
            byte foo() {
                return a;
            }
        `;
        expect(check(src)).toThrow(`Variable 'a' not defined`);
        done();
    });
});

describe('Analyzer correct programs', () => {
    test(`Handles if without else`, done => {
        let src = `
            byte a = 2;

            void bar() {}
            void foo(byte b) {
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
    test(`Handles joined if statements`, done => {
        let src = `
            byte a = 2;

            void foo(byte b) {
                if (!b) {
                } else if (a == b) {
                } else {
                }
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test(`Handles while statements`, done => {
        let src = `
            byte a = 2;

            void foo(byte b) {
                while (b) {
                    b += 1;
                }
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
    test(`Handles return statements`, done => {
        let src = `
            byte foo(byte b) {
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
    test(`Handles ternary expression`, done => {
        let src = `
            bool foo(byte b) {
                return b ? 1 : false;
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });

    test(`Handles bool assignment`, done => {
        let src = `
            void foo(bool b) {
                b = 4 && 3;
            }
        `;
        expect(check(src)).not.toThrow();
        done();
    });
});
