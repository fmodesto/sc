import parse from '../src/parser.js';
import '../src/optimizer.js';

const char = (value) => ({ type: 'char', value: value });
const int = (value) => ({ type: 'int', value: value });
const bool = (value) => ({ type: 'bool', value: value ? 1 : 0 });
const id = (name) => ({ name });

const expressions = [
    ['2 + 3', char(5)],
    ['-200 + 3', int(-197)],
    ['2 - 3', char(-1)],
    ['2 * 3', char(6)],
    ['2 / 3', char(0)],
    ['-13', char(-13)],
    ['-13 / 3', char(-4)],
    ['2 % 3', char(2)],
    ['-2 % 3', char(-2)],
    ['2 << 3', char(16)],
    ['0x9 >> 1', char(4)],
    ['-1 >> 1', char(127)],
    ['-1u >> 1', int(32767)],
    ['-1 << 1', char(-2)],
    ['-1 << 9', char(-2)],
    ['-1u << 9', int(-512)],
    ['0x2 & 0x3', char(2)],
    ['-1 & 3', char(3)],
    ['2 | 4', char(6)],
    ['-2 | -4', char(-2)],
    ['7 ^ 3', char(4)],
    ['-7 ^ -3', char(4)],
    ['~0', char(-1)],
    ['~2', char(-3)],
    ['2000 + 5000', int(7000)],
    ['2 < 4', bool(true)],
    ['4 < 2', bool(false)],
    ['2 <= 4', bool(true)],
    ['2 <= 2', bool(true)],
    ['4 <= 2', bool(false)],
    ['4 > 2', bool(true)],
    ['2 > -4', bool(true)],
    ['4 >= 2', bool(true)],
    ['2 >= 2', bool(true)],
    ['2 >= 4', bool(false)],
    ['2 == 4', bool(false)],
    ['4 == 4', bool(true)],
    ['2 != 4', bool(true)],
    ['2 != 2', bool(false)],
    ['1 && 4', bool(true)],
    ['2 && 2', bool(true)],
    ['-1 && 0', bool(false)],
    ['0 || 0x3', bool(true)],
    ['5 || 0', bool(true)],
    ['0 || 0', bool(false)],
    ['true && true', bool(true)],
    ['5 && true', bool(true)],
    ['true && 0', bool(false)],
    ['false || true', bool(true)],
    ['5 || false', bool(true)],
    ['false || 0', bool(false)],
    ['false == 0', bool(true)],
    ['false == true', bool(false)],
    ['true == 8', bool(true)],
    ['false != 0', bool(false)],
    ['false != true', bool(true)],
    ['true != 8', bool(false)],
    ['3 < 5 && 2 + 3 > 1', bool(true)],
    ['!3', bool(false)],
    ['!false', bool(true)],
    ['3 < 5 && 2 + 3 > 1', bool(true)],
    ['(bool) 4', bool(true)],
    ['(bool) 0', bool(false)],
    ['(char) (513 + 6)', char(7)],
    ['(int) -7', int(-7)],
    ['0 + a', id('a')],
    ['a + 0', id('a')],
    ['a - 0', id('a')],
    ['1 * a', id('a')],
    ['a * 1', id('a')],
    ['a / 1', id('a')],
    ['a << 0', id('a')],
    ['a >> 0', id('a')],
];

const noOptimized = [
    'a || 5',
    'a + 3 * c',
    '-a',
    '!a',
    '~a',
    'a / b',
    'a - b',
];

const optimize = (exp, rule = 'Exp') => parse(exp, rule).optimize();

describe('Optimize', () => {
    expressions.forEach(([exp, result]) => {
        test(`${exp} = ${result.name ? result.name : result.value.toString(16)}`, (done) => {
            let optimized = optimize(exp);
            expect(optimized).toMatchObject(result);
            done();
        });
    });

    test('Function call', (done) => {
        let optimized = optimize('foo(2*3, true || false)');
        expect(optimized).toMatchObject({
            kind: 'MethodCall',
            name: 'foo',
            parameters: [
                {
                    kind: 'Literal',
                    type: 'char',
                    value: 6,
                },
                {
                    kind: 'Literal',
                    type: 'bool',
                    value: 1,
                },
            ],
        });
        done();
    });

    test('Return statement', (done) => {
        let optimized = optimize('return 2*3;', 'ReturnStmt');
        expect(optimized).toMatchObject({
            kind: 'ReturnStatement',
            expression: [
                {
                    kind: 'Literal',
                    type: 'char',
                    value: 6,
                },
            ],
        });
        done();
    });

    test('Mulyiply by power', (done) => {
        let optimized = optimize('8 * a', 'Exp');
        expect(optimized).toMatchObject({
            kind: 'BinaryOperation',
            operation: '<<',
            lhs: {
                kind: 'Variable',
                name: 'a',
            },
            rhs: {
                kind: 'Literal',
                type: 'char',
                value: 3,
            },
        });
        done();
    });

    test('Mulyiply by power', (done) => {
        let optimized = optimize('a * 1024', 'Exp');
        expect(optimized).toMatchObject({
            kind: 'BinaryOperation',
            operation: '<<',
            lhs: {
                kind: 'Variable',
                name: 'a',
            },
            rhs: {
                kind: 'Literal',
                type: 'char',
                value: 10,
            },
        });
        done();
    });

    test('Divide by power', (done) => {
        let optimized = optimize('a / 4', 'Exp');
        expect(optimized).toMatchObject({
            kind: 'BinaryOperation',
            operation: '>>',
            lhs: {
                kind: 'Variable',
                name: 'a',
            },
            rhs: {
                kind: 'Literal',
                type: 'char',
                value: 2,
            },
        });
        done();
    });

    test('Subtract from 0', (done) => {
        let optimized = optimize('0 - a', 'Exp');
        expect(optimized).toMatchObject({
            kind: 'UnaryOperation',
            operation: '-',
            expression: {
                kind: 'Variable',
                name: 'a',
            },
        });
        done();
    });

    test('If statement', (done) => {
        let optimized = optimize('if (2*3) { a = 1+0; } else { a = 1<<2; }', 'Stmt');
        expect(optimized).toMatchObject({
            kind: 'IfStatement',
            predicate: {
                kind: 'Literal',
                type: 'char',
                value: 6,
            },
            consequent: [
                {
                    kind: 'AssignmentStatement',
                    name: 'a',
                    expression: {
                        kind: 'Literal',
                        type: 'char',
                        value: 1,
                    },
                },
            ],
            alternate: [
                {
                    kind: 'AssignmentStatement',
                    name: 'a',
                    expression: {
                        kind: 'Literal',
                        type: 'char',
                        value: 4,
                    },
                },
            ],
        });
        done();
    });

    test('Assingment same variable', (done) => {
        let optimized = optimize('a = a;', 'Stmt');
        expect(optimized).toEqual([]);
        done();
    });

    test('Assingment ternary', (done) => {
        let optimized = optimize('a = a < 0 ? -a : a;', 'Stmt');
        expect(optimized).toMatchObject({
            kind: 'IfStatement',
            predicate: {
                kind: 'BinaryOperation',
                operation: '<',
                lhs: {
                    kind: 'Variable',
                    name: 'a',
                },
                rhs: {
                    kind: 'Literal',
                    type: 'char',
                    value: 0,
                },
            },
            consequent: [{
                kind: 'AssignmentStatement',
                name: 'a',
                expression: {
                    kind: 'UnaryOperation',
                    operation: '-',
                    expression: {
                        kind: 'Variable',
                        name: 'a',
                    },
                },
            }],
            alternate: [],
        });
        done();
    });
});

describe('No Optimized', () => {
    noOptimized.forEach((exp) => {
        test(`${exp}`, (done) => {
            let original = parse(exp, 'Exp');
            let optimized = original.optimize();
            expect(optimized).toStrictEqual(original);
            done();
        });
    });
});
