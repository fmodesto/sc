import parse from '../src/parser.js';
import '../src/optimizer.js';

const byte = (value) => ({ type: 'byte', value: value });
const bool = (value) => ({ type: 'bool', value: value ? 1 : 0 });

const expressions = [
    ['2 + 3', byte(5)],
    ['2 - 3', byte(-1)],
    ['2 * 3', byte(6)],
    ['2 / 3', byte(0)],
    ['-13', byte(-13)],
    ['-13 / 3', byte(-4)],
    ['2 % 3', byte(2)],
    ['-2 % 3', byte(-2)],
    ['2 << 3', byte(16)],
    ['0x9 >> 1', byte(4)],
    ['-1 >> 1', byte(127)],
    ['-1 << 1', byte(-2)],
    ['0x2 & 0x3', byte(2)],
    ['-1 & 3', byte(3)],
    ['2 | 4', byte(6)],
    ['-2 | -4', byte(-2)],
    ['7 ^ 3', byte(4)],
    ['-7 ^ -3', byte(4)],
    ['~0', byte(-1)],
    ['~2', byte(-3)],
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
];

const noOptimized = [
    'a || 5',
    'a + 3 * c',
    '-a',
    '!a',
    '~a',
];

const optimize = (exp, rule = 'Exp') => parse(exp, rule).optimize();

describe('Optimize', () => {
    expressions.forEach(([exp, result]) => {
        test(`${exp} = ${result.value.toString(16)}`, (done) => {
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
                    type: 'byte',
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
                    type: 'byte',
                    value: 6,
                },
            ],
        });
        done();
    });

    test('If statement', (done) => {
        let optimized = optimize('if (2*3) { a = 1+0; } else { a = 1<<2; }', 'Stmt');
        expect(optimized).toMatchObject({
            kind: 'IfStatement',
            predicate: {
                kind: 'Literal',
                type: 'byte',
                value: 6,
            },
            consequent: [
                {
                    kind: 'AssignmentStatement',
                    name: 'a',
                    expression: {
                        kind: 'Literal',
                        type: 'byte',
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
                        type: 'byte',
                        value: 4,
                    },
                },
            ],
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
