import parse from '../src/parser.js';
import '../src/analyzer.js';
import '../src/codegen.js';
import '../src/optimizer.js';
import createContext from '../src/context.js';
import createRegister from '../src/register.js';

const generateExp = (exp, context, register) => parse(exp, 'Exp').generate(context, register).instructions;
const optimizeExp = (exp, context, register) => parse(exp, 'Exp').optimize().generate(context, register).instructions;
const generate = (code) => {
    let program = parse(code);
    program.analyze();
    return program.generate();
};

describe('Generate code for expression', () => {
    let globalContext = createContext();
    globalContext.addVar('a', 'char');
    globalContext.addVar('b', 'char');
    globalContext.addVar('c', 'int');
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
        ['a + 5', 'ADD test_0,a,#$05'],
        ['7 + p2', 'ADD test_0,#$07,test_p2'],
        ['c + 1000', 'ADD test_0:test_1,c_H:c_L,#$03:#$E8'],
        ['c + -1000', 'ADD test_0:test_1,c_H:c_L,#$FC:#$18'],
        ['c + (int) -10', 'ADD test_0:test_1,c_H:c_L,#$FF:#$F6'],
    ];

    simple.forEach(([exp, expected]) => {
        test(exp, (done) => {
            let register = createRegister(context.getCurrentMethod());
            expect(optimizeExp(exp, context, register)).toEqual([expected]);
            done();
        });
    });

    test('Complex expression', (done) => {
        let register = createRegister(context.getCurrentMethod());
        expect(generateExp('-7 + a * 5 + 5 * (b+3) << 2', context, register)).toEqual([
            'NEG test_0,#$07',
            'MUL test_1,a,#$05',
            'ADD test_1,test_0,test_1',
            'ADD test_0,b,#$03',
            'MUL test_0,#$05,test_0',
            'ADD test_0,test_1,test_0',
            'SHL test_0,test_0,#$02',
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
            'MUL test_0,#$02,#$03',
            'NEG test_0,test_0',
            'NEG test_1,#$04',
            'DIV test_1,a,test_1',
            'ADD test_2,b,#$03',
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
            'MOV foo_p2,#$03',
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
            'MUL test_0,a,#$07',
            'DIV test_1,a,#$02',
            'ADD test_1,#$03,test_1',
            'SUB test_1,test_1,test_p1',
            'ADD test_2,test_p1,#$02',
            'SHL test_2,test_2,#$03',
            'MOV foo_p1,test_0',
            'MOV foo_p2,test_1',
            'MOV foo_p3,test_2',
            'CALL foo',
            'MOV test_2,foo_return',
            'MOD test_2,#$05,test_2',
            'SUB test_2,test_2,#$09',
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
            'MOV test_0,#$01',
            'JMP test_vm_1',
            '.LABEL test_vm_0',
            'MOV test_0,#$02',
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
            'MOV foo_p1,#$01',
            'MOV foo_p2,#$02',
            'MOV foo_p3,#$03',
            'CALL foo',
            'MOV test_0,foo_return',
            'JMP test_vm_1',
            '.LABEL test_vm_0',
            'MOV bar_p1,a',
            'MOV bar_p2,b',
            'CALL bar',
            'MOV test_0,bar_return',
            'SHL test_0,test_0,#$01',
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
            char ga = 73;
            int gb = -7;
            bool gc = true;
            void foo(char a, int b, bool c) {
                char pa;
                int pb;
                bool pc;
            }
        `;
        expect(generate(code)).toEqual([
            '.BYTE ga $49',
            '.BYTE gb_H $FF',
            '.BYTE gb_L $F9',
            '.BYTE gc $01',
            '.FUNCTION foo',
            '.BYTE foo_a 0',
            '.BYTE foo_b_H 0',
            '.BYTE foo_b_L 0',
            '.BYTE foo_c 0',
            '.LOCALS',
            '.BYTE foo_pa 0',
            '.BYTE foo_pb_H 0',
            '.BYTE foo_pb_L 0',
            '.BYTE foo_pc 0',
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
            'ADD foo_0,foo_a,#$01',
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
            'DIV foo_0,#$0A,foo_a',
            'MOV foo_return,foo_0',
            'JMP foo_end',
            '.LABEL foo_vm_1',
            'MOV foo_return,#$00',
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
            'DIV foo_0,#$0A,foo_a',
            'MOV foo_return,foo_0',
            'JMP foo_end',
            'JMP foo_vm_1',
            '.LABEL foo_vm_0',
            'MOV foo_return,#$00',
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
            'MOV foo_b,#$00',
            '.LABEL foo_vm_0',
            'JZ foo_vm_1,foo_a',
            'SHL foo_0,foo_a,#$01',
            'MOV foo_a,foo_0',
            'ADD foo_0,foo_b,#$01',
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
            '.CODE',
            'MOV bar_a,foo_a',
            'CALL bar',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('Cast return type', (done) => {
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

    test('Cast parameters', (done) => {
        let code = `
            bool bar(bool a, bool b) {
                return a ^ b;
            }
            char foo(char a) {
                return (char) bar(a, 3);
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION bar',
            '.BYTE bar_return 0',
            '.BYTE bar_a 0',
            '.BYTE bar_b 0',
            '.TMP',
            '.BYTE bar_0 0',
            '.CODE',
            'XOR bar_0,bar_a,bar_b',
            'MOV bar_return,bar_0',
            'JMP bar_end',
            '.LABEL bar_end',
            '.RETURN bar',
            '.FUNCTION foo',
            '.BYTE foo_return 0',
            '.BYTE foo_a 0',
            '.TMP',
            '.BYTE foo_0 0',
            '.CODE',
            'BOOL bar_a,foo_a',
            'BOOL bar_b,#$03',
            'CALL bar',
            'MOV foo_0,bar_return',
            'MOV foo_return,foo_0',
            'JMP foo_end',
            '.LABEL foo_end',
            '.RETURN foo',
        ]);
        done();
    });

    test('Integers parameters', (done) => {
        let code = `
            int shr(int a, char b) {
                b &= 0x0F;
                while (b) {
                    a >>= 1;
                    b -= 1;
                }
                return a;
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION shr',
            '.BYTE shr_return_H 0',
            '.BYTE shr_return_L 0',
            '.BYTE shr_a_H 0',
            '.BYTE shr_a_L 0',
            '.BYTE shr_b 0',
            '.TMP',
            '.BYTE shr_0 0',
            '.BYTE shr_1 0',
            '.CODE',
            'AND shr_0,shr_b,#$0F',
            'MOV shr_b,shr_0',
            '.LABEL shr_vm_0',
            'JZ shr_vm_1,shr_b',
            'SHR shr_0:shr_1,shr_a_H:shr_a_L,#$01',
            'MOV shr_a_H:shr_a_L,shr_0:shr_1',
            'SUB shr_1,shr_b,#$01',
            'MOV shr_b,shr_1',
            'JMP shr_vm_0',
            '.LABEL shr_vm_1',
            'MOV shr_return_H:shr_return_L,shr_a_H:shr_a_L',
            'JMP shr_end',
            '.LABEL shr_end',
            '.RETURN shr',
        ]);
        done();
    });

    test('Cast keeps lower variable', (done) => {
        let code = `
            int test(int a, char b) {
                return (char) (a >> b);
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION test',
            '.BYTE test_return_H 0',
            '.BYTE test_return_L 0',
            '.BYTE test_a_H 0',
            '.BYTE test_a_L 0',
            '.BYTE test_b 0',
            '.TMP',
            '.BYTE test_0 0',
            '.BYTE test_1 0',
            '.CODE',
            'SHR test_0:test_1,test_a_H:test_a_L,test_b',
            'MOV test_1,test_0:test_1',
            'CAST test_return_H:test_return_L,test_1',
            'JMP test_end',
            '.LABEL test_end',
            '.RETURN test',
        ]);
        done();
    });

    test('Cast function', (done) => {
        let code = `
            char foo(int a) {
                return (char) (a >> 8);
            }
            int test(char a) {
                return foo(a);
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION foo',
            '.BYTE foo_return 0',
            '.BYTE foo_a_H 0',
            '.BYTE foo_a_L 0',
            '.TMP',
            '.BYTE foo_0 0',
            '.BYTE foo_1 0',
            '.CODE',
            'SHR foo_0:foo_1,foo_a_H:foo_a_L,#$08',
            'MOV foo_1,foo_0:foo_1',
            'MOV foo_return,foo_1',
            'JMP foo_end',
            '.LABEL foo_end',
            '.RETURN foo',

            '.FUNCTION test',
            '.BYTE test_return_H 0',
            '.BYTE test_return_L 0',
            '.BYTE test_a 0',
            '.TMP',
            '.BYTE test_0 0',
            '.CODE',
            'CAST foo_a_H:foo_a_L,test_a',
            'CALL foo',
            'MOV test_0,foo_return',
            'CAST test_return_H:test_return_L,test_0',
            'JMP test_end',
            '.LABEL test_end',
            '.RETURN test',
        ]);
        done();
    });

    test('Cast all with all', (done) => {
        let code = `
            void test() {
                char a;
                int b;
                bool c;
                a = (char) a;
                a = (char) b;
                a = (char) c;
                b = (int) a;
                b = (int) b;
                b = (int) c;
                c = (bool) a;
                c = (bool) b;
                c = (bool) c;
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION test',
            '.LOCALS',
            '.BYTE test_a 0',
            '.BYTE test_b_H 0',
            '.BYTE test_b_L 0',
            '.BYTE test_c 0',
            '.TMP',
            '.BYTE test_0 0',
            '.BYTE test_1 0',
            '.CODE',
            'MOV test_0,test_b_H:test_b_L',
            'MOV test_a,test_0',
            'MOV test_a,test_c',
            'CAST test_0:test_1,test_a',
            'MOV test_b_H:test_b_L,test_0:test_1',
            'CAST test_0:test_1,test_c',
            'MOV test_b_H:test_b_L,test_0:test_1',
            'BOOL test_1,test_a',
            'MOV test_c,test_1',
            'BOOL test_1,test_b_H:test_b_L',
            'MOV test_c,test_1',
            '.LABEL test_end',
            '.RETURN test',
        ]);
        done();
    });

    test('Cast before operation', (done) => {
        let code = `
            void test() {
                char a;
                int b;
                b = 1024;
                b += a;
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION test',
            '.LOCALS',
            '.BYTE test_a 0',
            '.BYTE test_b_H 0',
            '.BYTE test_b_L 0',
            '.TMP',
            '.BYTE test_0 0',
            '.BYTE test_1 0',
            '.CODE',
            'MOV test_b_H:test_b_L,#$04:#$00',
            'CAST test_0:test_1,test_a',
            'ADD test_0:test_1,test_b_H:test_b_L,test_0:test_1',
            'MOV test_b_H:test_b_L,test_0:test_1',
            '.LABEL test_end',
            '.RETURN test',
        ]);
        done();
    });

    test('Cast numbers', (done) => {
        let code = `
            bool test(int a) {
                return a < 0;
            }
        `;
        expect(generate(code)).toEqual([
            '.FUNCTION test',
            '.BYTE test_return 0',
            '.BYTE test_a_H 0',
            '.BYTE test_a_L 0',
            '.TMP',
            '.BYTE test_0 0',
            '.BYTE test_1 0',
            '.CODE',
            'CAST test_0:test_1,#$00',
            'LT test_1,test_a_H:test_a_L,test_0:test_1',
            'MOV test_return,test_1',
            'JMP test_end',
            '.LABEL test_end',
            '.RETURN test',
        ]);
        done();
    });
});
