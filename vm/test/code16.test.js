import parse from '../src/parser.js';
import codegen from '../src/codegen.js';
import runner from './runner.js';

const execute = (src, memory = {}) => {
    let code = codegen(parse(src));
    runner(code, memory);
    return {
        ...memory,
        code,
    };
};

const castw = (v) => (v >= (1 << 15) ? v - (1 << 16) : v);

function word() {
    return [0x0000, 0x00FF, 0x55AA, 0x8000, 0xAA55, 0xFF00, 0xFFFF];
}

function dense() {
    let data = [];
    for (let i = 0; i < 256; i += 51) {
        for (let j = 0; j < 256; j += 51) {
            data.push(i << 8 | j);
        }
    }
    return data;
}

function ones() {
    return word().map((e) => (e ? e : 1));
}

function nibble() {
    return [0, 1, 2, 7, 8, 9, 15, 16, 20];
}

function unary(exp) {
    let variants = [
        (op, dest, e) => [
            `${op} ${dest},#${(e >> 8) & 0xFF}:#${e & 0xFF}`,
        ],
        (op, dest, e) => [
            `MOV expH:expL,#${(e >> 8) & 0xFF}:#${e & 0xFF}`,
            `${op} ${dest},expH:expL`,
        ],
        (op, dest, e) => [
            `MOV destH:destL,#${(e >> 8) & 0xFF}:#${e & 0xFF}`,
            `${op} ${dest},destH:destL`,
        ],
        (op, dest, e) => [
            `MOV destL:destH,#${(e >> 8) & 0xFF}:#${e & 0xFF}`,
            `${op} ${dest},destL:destH`,
        ],
    ];
    return (op, dest, fn) => exp().map((e) => variants.map((v) => [v(op, dest, e), fn(e)])).flat();
}

function binary(lhs, rhs) {
    let variants = [
        (op, dest, l, r) => [
            `${op} ${dest},#${(l >> 8) & 0xFF}:#${l & 0xFF},#${(r >> 8) & 0xFF}:#${r & 0xFF}`,
        ],
        (op, dest, l, r) => [
            `MOV lhsH:lhsL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `${op} ${dest},lhsH:lhsL,#${(r >> 8) & 0xFF}:#${r & 0xFF}`,
        ],
        (op, dest, l, r) => [
            `MOV rhsH:rhsL,#${(r >> 8) & 0xFF}:#${r & 0xFF}`,
            `${op} ${dest},#${(l >> 8) & 0xFF}:#${l & 0xFF},rhsH:rhsL`,
        ],
        (op, dest, l, r) => [
            `MOV lhsH:lhsL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `MOV rhsH:rhsL,#${(r >> 8) & 0xFF}:#${r & 0xFF}`,
            `${op} ${dest},lhsH:lhsL,rhsH:rhsL`,
        ],
        (op, dest, l, r) => [
            `MOV destH:destL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `MOV rhsH:rhsL,#${(r >> 8) & 0xFF}:#${r & 0xFF}`,
            `${op} ${dest},destH:destL,rhsH:rhsL`,
        ],
        (op, dest, l, r) => [
            `MOV lhsH:lhsL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `MOV destH:destL,#${(r >> 8) & 0xFF}:#${r & 0xFF}`,
            `${op} ${dest},lhsH:lhsL,destH:destL`,
        ],
        (op, dest, l, r) => [
            `MOV destL:destH,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `MOV rhsH:rhsL,#${(r >> 8) & 0xFF}:#${r & 0xFF}`,
            `${op} ${dest},destL:destH,rhsH:rhsL`,
        ],
        (op, dest, l, r) => [
            `MOV lhsH:lhsL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `MOV destL:destH,#${(r >> 8) & 0xFF}:#${r & 0xFF}`,
            `${op} ${dest},lhsH:lhsL,destL:destH`,
        ],
        (op, dest, l, r) => (l === r ? [
            `MOV expH:expL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `${op} ${dest},expH:expL,expH:expL`,
        ] : []),
        (op, dest, l, r) => (l === r ? [
            `MOV destH:destL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `${op} ${dest},destH:destL,destH:destL`,
        ] : []),
    ];
    return (op, dest, fn) => rhs().map((r) => lhs().map((l) => variants.map((v) => [v(op, dest, l, r), fn(l, r)]).filter(([e]) => e.length)).flat()).flat();
}

function shift(lhs, rhs) {
    let variants = [
        (op, dest, l, r) => [
            `${op} ${dest},#${(l >> 8) & 0xFF}:#${l & 0xFF},#${r & 0xFF}`,
        ],
        (op, dest, l, r) => [
            `MOV lhsH:lhsL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `${op} ${dest},lhsH:lhsL,#${r & 0xFF}`,
        ],
        (op, dest, l, r) => [
            `MOV rhs,#${r & 0xFF}`,
            `${op} ${dest},#${(l >> 8) & 0xFF}:#${l & 0xFF},rhs`,
        ],
        (op, dest, l, r) => [
            `MOV lhsH:lhsL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `MOV rhs,#${r & 0xFF}`,
            `${op} ${dest},lhsH:lhsL,rhs`,
        ],
        (op, dest, l, r) => [
            `MOV destH:destL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `MOV rhs,#${r & 0xFF}`,
            `${op} ${dest},destH:destL,rhs`,
        ],
        (op, dest, l, r) => [
            `MOV lhsH:lhsL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `MOV destH,#${r & 0xFF}`,
            `${op} ${dest},lhsH:lhsL,destH`,
        ],
        (op, dest, l, r) => [
            `MOV lhsH:lhsL,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `MOV destL,#${r & 0xFF}`,
            `${op} ${dest},lhsH:lhsL,destL`,
        ],
        (op, dest, l, r) => [
            `MOV destL:destH,#${(l >> 8) & 0xFF}:#${l & 0xFF}`,
            `MOV rhs,#${r & 0xFF}`,
            `${op} ${dest},destL:destH,rhs`,
        ],
    ];
    return (op, dest, fn) => rhs().map((r) => lhs().map((l) => variants.map((v) => [v(op, dest, l, r), fn(l, r)])).flat()).flat();
}

const intScenarios = [
    ['NEG', unary(word), (a) => -a & 0xFFFF],
    ['INV', unary(word), (a) => ~a & 0xFFFF],
    ['MOV', unary(word), (a) => a & 0xFFFF],
    ['ADD', binary(word, word), (a, b) => (a + b) & 0xFFFF],
    ['SUB', binary(word, word), (a, b) => (a - b) & 0xFFFF],
    ['MUL', binary(word, word), (a, b) => (castw(a) * castw(b)) & 0xFFFF],
    ['DIV', binary(word, ones), (a, b) => (castw(a) / castw(b)) & 0xFFFF],
    ['MOD', binary(word, ones), (a, b) => (castw(a) % castw(b)) & 0xFFFF],
    ['SHL', shift(word, nibble), (a, b) => (a << (b & 0x0F)) & 0xFFFF],
    ['SHR', shift(word, nibble), (a, b) => (a >>> (b & 0x0F)) & 0xFFFF],
    ['AND', binary(word, word), (a, b) => (a & b) & 0xFFFF],
    ['OR', binary(word, word), (a, b) => (a | b) & 0xFFFF],
    ['XOR', binary(word, word), (a, b) => (a ^ b) & 0xFFFF],
];

describe('Generates 16-bit integer operations', () => {
    intScenarios.forEach(([opcode, generator, fn]) => {
        let results = generator(opcode, 'destH:destL', fn);
        results.forEach(([expression, result]) => {
            test(`${expression.join(' ')} ${result}`, (done) => {
                expect(execute(expression.join('\n'))).toMatchObject({
                    destH: result >> 8 & 0xFF,
                    destL: result & 0xFF,
                });
                done();
            });
        });
    });
});

describe('Generates 16-bit code with cast', () => {
    intScenarios.forEach(([opcode, generator, fn]) => {
        let results = generator(opcode, 'dest', fn);
        results.forEach(([expression, result]) => {
            test(`${expression.join(' ')} ${result}`, (done) => {
                expect(execute(expression.join('\n'))).toMatchObject({
                    dest: result & 0xFF,
                });
                done();
            });
        });
    });
});

const byteScenarios = [
    ['BOOL', unary(word), (a) => (a ? 1 : 0)],
    ['NOT', unary(word), (a) => (a ? 0 : 1)],
    ['LT', binary(word, word), (a, b) => ((castw(a) < castw(b)) ? 1 : 0)],
    ['LTE', binary(word, word), (a, b) => ((castw(a) <= castw(b)) ? 1 : 0)],
    ['EQ', binary(word, word), (a, b) => ((castw(a) === castw(b)) ? 1 : 0)],
    ['NEQ', binary(word, word), (a, b) => ((castw(a) !== castw(b)) ? 1 : 0)],
    ['GTE', binary(word, word), (a, b) => ((castw(a) >= castw(b)) ? 1 : 0)],
    ['GT', binary(word, word), (a, b) => ((castw(a) > castw(b)) ? 1 : 0)],
];

describe('Generates 16-bit boolean operations', () => {
    byteScenarios.forEach(([opcode, generator, fn]) => {
        let results = generator(opcode, 'dest', fn);
        results.forEach(([expression, result]) => {
            test(`${expression.join(' ')} ${result}`, (done) => {
                try {
                    expect(execute(expression.join('\n'))).toMatchObject({
                        dest: result,
                    });
                    done();
                } catch (e) {
                    expect(execute(expression.join('\n'))).toMatchObject({
                        dest: result,
                        code: [],
                    });
                }
            });
        });
    });
});
//183 208 148 == 540
