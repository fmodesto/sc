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

const castb = (v) => (v >= (1 << 7) ? v - (1 << 8) : v);
const castw = (v) => (v >= (1 << 15) ? v - (1 << 16) : v);

function byte() {
    let data = [];
    for (let i = 0; i < 256; i += 51) {
        data.push(i);
    }
    return data;
}

function word() {
    // return byte().map((h) => byte().map((l) => h << 8 | l)).flat();
    return [0x0000, 0x00FF, 0x55AA, 0x8000, 0xAA55, 0xFF00, 0xFFFF];
}

function ones() {
    // return word().map((e) => (e ? e : 1));
    return [0x0001, 0x00FF, 0x55AA, 0x8001, 0xAA55, 0xFF00, 0xFFFF];
}

function nibble() {
    return [0, 1, 2, 7, 8, 9, 15, 16, 20];
}

function cast(exp) {
    let variants = [
        (op, dest, e) => [
            `${op} ${dest},#${e & 0xFF}`,
        ],
        (op, dest, e) => [
            `MOV exp,#${e & 0xFF}`,
            `${op} ${dest},exp`,
        ],
        (op, dest, e) => [
            `MOV destH,#${e & 0xFF}`,
            `${op} ${dest},destH`,
        ],
        (op, dest, e) => [
            `MOV destL,#${e & 0xFF}`,
            `${op} ${dest},destL`,
        ],
    ];
    return (op, dest, fn) => exp().map((e) => variants.map((v) => [v(op, dest, e), fn(e)])).flat();
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

function jmp(exp) {
    let variants = [
        (op, dest, e) => [
            `${op} target,#${(e >> 8) & 0xFF}:#${e & 0xFF}`,
            `MOV ${dest},#$00`,
            'JMP end',
            '.LABEL target',
            `MOV ${dest},#$01`,
            '.LABEL end',
        ],
        (op, dest, e) => [
            `MOV expH:expL,#${(e >> 8) & 0xFF}:#${e & 0xFF}`,
            `${op} target,expH:expL`,
            `MOV ${dest},#$00`,
            'JMP end',
            '.LABEL target',
            `MOV ${dest},#$01`,
            '.LABEL end',
        ],
    ];
    return (op, dest, fn) => exp().map((e) => variants.map((v) => [v(op, dest, e), fn(e)])).flat();
}

const intScenarios = [
    ['CAST', cast(byte), (a) => castb(a) & 0xFFFF],
    ['NEG', unary(word), (a) => -a & 0xFFFF],
    ['INV', unary(word), (a) => ~a & 0xFFFF],
    ['MOV', unary(word), (a) => a & 0xFFFF],
    ['ADD', binary(word, word), (a, b) => (a + b) & 0xFFFF],
    ['SUB', binary(word, word), (a, b) => (a - b) & 0xFFFF],
    ['MUL', binary(word, word), (a, b) => (castw(a) * castw(b)) & 0xFFFF],
    ['DIV', binary(ones, ones), (a, b) => (castw(a) / castw(b)) & 0xFFFF],
    ['MOD', binary(ones, ones), (a, b) => (castw(a) % castw(b)) & 0xFFFF],
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
                try {
                    expect(execute(expression.join('\n'))).toMatchObject({
                        destH: result >> 8 & 0xFF,
                        destL: result & 0xFF,
                    });
                    done();
                } catch (e) {
                    expect(execute(expression.join('\n'))).toMatchObject({
                        destH: result >> 8 & 0xFF,
                        destL: result & 0xFF,
                        code: [],
                    });
                }
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
    ['JZ', jmp(word), (a) => (a ? 0 : 1)],
    ['JNZ', jmp(word), (a) => (a ? 1 : 0)],
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
