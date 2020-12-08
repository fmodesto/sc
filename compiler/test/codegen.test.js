import parse from '../src/parser.js';
import '../src/analyzer.js';
import '../src/codegen.js';
import createContext from '../src/context.js';
import createRegister from '../src/register.js';

const generateExp = (exp, context, register) => parse(exp, 'Exp').generate(context, register).instructions;
const generate = (code) => parse(code).generate();

describe('Generate code for expression', () => {
    let globalContext = createContext();
    globalContext.addVar('a', 'char');
    globalContext.addVar('b', 'char');
    globalContext.addMethod('test', 'char', [{ name: 'p1', type: 'char' }, { name: 'p2', type: 'char' }]);
    globalContext.addMethod('foo', 'char', [{ name: 'p1', type: 'char' }, { name: 'p2', type: 'char' }, { name: 'p3', type: 'char' }]);
    globalContext.addMethod('bar', 'char', [{ name: 'p1', type: 'char' }, { name: 'p2', type: 'char' }]);
    let context = globalContext.createContext('test');
    context.addVar('p1', 'char');
    context.addVar('p2', 'char');

    const simple = [
        ['a + b', 'ADD test_0,a,b'],
        ['a - b', 'SUB test_0,a,b'],
        ['a * b', 'MUL test_0,a,b'],
        ['a / b', 'DIV test_0,a,b'],
        ['a % b', 'MOD test_0,a,b'],
        ['a << b', 'SHL test_0,a,b'],
        ['a >> b', 'SHR test_0,a,b'],
        ['a & b', 'AND test_0,a,b'],
        ['a | b', 'OR test_0,a,b'],
        ['a ^ b', 'XOR test_0,a,b'],
        ['a < b', 'LT test_0,a,b'],
        ['a <= b', 'LTE test_0,a,b'],
        ['a == b', 'EQ test_0,a,b'],
        ['a != b', 'NEQ test_0,a,b'],
        ['a >= b', 'GTE test_0,a,b'],
        ['a > b', 'GT test_0,a,b'],
        ['a << b', 'SHL test_0,a,b'],
        ['a >> b', 'SHR test_0,a,b'],
        ['-a', 'NEG test_0,a'],
        ['~a', 'INV test_0,a'],
        ['!a', 'NOT test_0,a'],
        ['p1 + b', 'ADD test_0,test_p1,b'],
        ['p1 + p2', 'ADD test_0,test_p1,test_p2'],
        ['p1 + p2', 'ADD test_0,test_p1,test_p2'],
        ['a + 5', 'ADD test_0,a,#5'],
        ['7 + p2', 'ADD test_0,#7,test_p2'],
    ];

    simple.forEach(([exp, expected]) => {
        test(exp, (done) => {
            let register = createRegister(context.getCurrentMethod());
            expect(generateExp(exp, context, register)).toEqual([expected]);
            done();
        });
    });

    test('Complex expression', (done) => {
        let register = createRegister(context.getCurrentMethod());
        expect(generateExp('-7 + a * 5 + 5 * (b+3) << 2', context, register)).toEqual([
            'NEG test_0,#7',
            'MUL test_1,a,#5',
            'ADD test_1,test_0,test_1',
            'ADD test_0,b,#3',
            'MUL test_0,#5,test_0',
            'ADD test_0,test_1,test_0',
            'SHL test_0,test_0,#2',
        ]);
        expect(register.getGenerated()).toEqual([
            'test_0',
            'test_1',
        ]);
        expect(register.getInUse()).toEqual([
            'test_0',
        ]);
        done();
    });

    test('Logic expression', (done) => {
        let register = createRegister(context.getCurrentMethod());
        expect(generateExp('a && (b || p1)', context, register)).toEqual([
            'BOOL test_0,a',
            'JZ test_vm_0,test_0',
            'BOOL test_0,b',
            'JNZ test_vm_1,test_0',
            'BOOL test_0,test_p1',
            '.LABEL test_vm_1',
            '.LABEL test_vm_0',
        ]);
        expect(register.getGenerated()).toEqual([
            'test_0',
        ]);
        expect(register.getInUse()).toEqual([
            'test_0',
        ]);
        done();
    });

    test('Multiple temps expression', (done) => {
        let register = createRegister(context.getCurrentMethod());
        expect(generateExp('-(2*3) + ((a/-4) * (b+3))', context, register)).toEqual([
            'MUL test_0,#2,#3',
            'NEG test_0,test_0',
            'NEG test_1,#4',
            'DIV test_1,a,test_1',
            'ADD test_2,b,#3',
            'MUL test_2,test_1,test_2',
            'ADD test_2,test_0,test_2',
        ]);
        expect(register.getGenerated()).toEqual([
            'test_0',
            'test_1',
            'test_2',
        ]);
        expect(register.getInUse()).toEqual([
            'test_2',
        ]);
        done();
    });

    test('Method call', (done) => {
        let register = createRegister(context.getCurrentMethod());
        expect(generateExp('foo(a, 3, p1)', context, register)).toEqual([
            'MOV foo_p1,a',
            'MOV foo_p2,#3',
            'MOV foo_p3,test_p1',
            'CALL foo',
            'MOV test_0,foo_return',
        ]);
        expect(register.getGenerated()).toEqual([
            'test_0',
        ]);
        expect(register.getInUse()).toEqual([
            'test_0',
        ]);
        done();
    });

    test('Complex call expression', (done) => {
        let register = createRegister(context.getCurrentMethod());
        expect(generateExp('5 % foo(a * 7, 3 + (a / 2) - p1, (p1 + 2) << 3) - 9', context, register)).toEqual([
            'MUL test_0,a,#7',
            'DIV test_1,a,#2',
            'ADD test_1,#3,test_1',
            'SUB test_1,test_1,test_p1',
            'ADD test_2,test_p1,#2',
            'SHL test_2,test_2,#3',
            'MOV foo_p1,test_0',
            'MOV foo_p2,test_1',
            'MOV foo_p3,test_2',
            'CALL foo',
            'MOV test_2,foo_return',
            'MOD test_2,#5,test_2',
            'SUB test_2,test_2,#9',
        ]);
        expect(register.getGenerated()).toEqual([
            'test_0',
            'test_1',
            'test_2',
        ]);
        expect(register.getInUse()).toEqual([
            'test_2',
        ]);
        done();
    });

    test('Ternary expression', (done) => {
        let register = createRegister(context.getCurrentMethod());
        expect(generateExp('a ? 1 : 2', context, register)).toEqual([
            'JZ test_vm_0,a',
            'MOV test_0,#1',
            'JMP test_vm_1',
            '.LABEL test_vm_0',
            'MOV test_0,#2',
            '.LABEL test_vm_1',
        ]);
        expect(register.getGenerated()).toEqual([
            'test_0',
        ]);
        expect(register.getInUse()).toEqual([
            'test_0',
        ]);
        done();
    });

    test('Complex ternary expression', (done) => {
        let register = createRegister(context.getCurrentMethod());
        expect(generateExp('a + b ? foo(1,2,3) : bar(a,b) << 1', context, register)).toEqual([
            'ADD test_0,a,b',
            'JZ test_vm_0,test_0',
            'MOV foo_p1,#1',
            'MOV foo_p2,#2',
            'MOV foo_p3,#3',
            'CALL foo',
            'MOV test_0,foo_return',
            'JMP test_vm_1',
            '.LABEL test_vm_0',
            'MOV bar_p1,a',
            'MOV bar_p2,b',
            'CALL bar',
            'MOV test_0,bar_return',
            'SHL test_0,test_0,#1',
            '.LABEL test_vm_1',
        ]);
        expect(register.getGenerated()).toEqual([
            'test_0',
        ]);
        expect(register.getInUse()).toEqual([
            'test_0',
        ]);
        done();
    });
});

describe('Generate code', () => {

    test('Empty function', (done) => {
        let code = `
            void foo() {}
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION foo',
            '.CODE',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('Empty function return', (done) => {
        let code = `
            void foo() {
                return;
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION foo',
            '.CODE',
            'JMP foo_end',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('Vars', (done) => {
        let code = `
            char a = 73;
            void foo(char b) {
                char c;
            }
        `;
        expect(generate(code)).toEqual([
            '.BYTE a 73',
            '.FUNCTION foo',
            '.BYTE foo_b 0',
            '.LOCALS',
            '.BYTE foo_c 0',
            '.CODE',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('Return function', (done) => {
        let code = `
            char foo(char a) {
                return a;
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION foo',
            '.BYTE foo_return 0',
            '.BYTE foo_a 0',
            '.CODE',
            'MOV foo_return,foo_a',
            'JMP foo_end',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('Return expression', (done) => {
        let code = `
            char foo(char a) {
                return a + 1;
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION foo',
            '.BYTE foo_return 0',
            '.BYTE foo_a 0',
            '.TMP',
            '.BYTE foo_0 0',
            '.CODE',
            'ADD foo_0,foo_a,#1',
            'MOV foo_return,foo_0',
            'JMP foo_end',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('If statement', (done) => {
        let code = `
            char foo(char a) {
                if (a) {
                    return 10 / a;
                }
                return 0;
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION foo',
            '.BYTE foo_return 0',
            '.BYTE foo_a 0',
            '.TMP',
            '.BYTE foo_0 0',
            '.CODE',
            'JZ foo_vm_1,foo_a',
            'DIV foo_0,#10,foo_a',
            'MOV foo_return,foo_0',
            'JMP foo_end',
            '.LABEL foo_vm_1',
            'MOV foo_return,#0',
            'JMP foo_end',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('If-else statement', (done) => {
        let code = `
            char foo(char a) {
                if (a) {
                    return 10 / a;
                } else {
                    return 0;
                }
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION foo',
            '.BYTE foo_return 0',
            '.BYTE foo_a 0',
            '.TMP',
            '.BYTE foo_0 0',
            '.CODE',
            'JZ foo_vm_0,foo_a',
            'DIV foo_0,#10,foo_a',
            'MOV foo_return,foo_0',
            'JMP foo_end',
            'JMP foo_vm_1',
            '.LABEL foo_vm_0',
            'MOV foo_return,#0',
            'JMP foo_end',
            '.LABEL foo_vm_1',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('While statement', (done) => {
        let code = `
            char foo(char a) {
                char b;
                b = 0;
                while (a) {
                    a <<= 1;
                    b += 1;
                }
                return b;
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION foo',
            '.BYTE foo_return 0',
            '.BYTE foo_a 0',
            '.LOCALS',
            '.BYTE foo_b 0',
            '.TMP',
            '.BYTE foo_0 0',
            '.CODE',
            'MOV foo_b,#0',
            '.LABEL foo_vm_0',
            'JZ foo_vm_1,foo_a',
            'SHL foo_0,foo_a,#1',
            'MOV foo_a,foo_0',
            'ADD foo_0,foo_b,#1',
            'MOV foo_b,foo_0',
            'JMP foo_vm_0',
            '.LABEL foo_vm_1',
            'MOV foo_return,foo_b',
            'JMP foo_end',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('Call statement', (done) => {
        let code = `
            void bar(char a) {
            }

            void foo(char a) {
                bar(a);
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION bar',
            '.BYTE bar_a 0',
            '.CODE',
            '.LABEL bar_end',
            '.RETURN bar',

            '.FUNCTION foo',
            '.BYTE foo_a 0',
            '.TMP',
            '.BYTE foo_0 0',
            '.CODE',
            'MOV bar_a,foo_a',
            'CALL bar',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('Boolean logic', (done) => {
        let code = `
            bool foo(char a) {
                return a;
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION foo',
            '.BYTE foo_return 0',
            '.BYTE foo_a 0',
            '.CODE',
            'BOOL foo_return,foo_a',
            'JMP foo_end',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

});