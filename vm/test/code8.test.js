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

const castb = (v) => (v > 127 ? v - 256 : v);

describe('Generates 8-bit code', () => {

    function byte() {
        return [0x00, 0x55, 0x80, 0xAA, 0xFF];
    }

    function ones() {
        return [0x01, 0x55, 0x80, 0xAA, 0xFF];
    }
    function nibble() {
        return [0, 1, 2, 7, 8, 10];
    }

    function unary(exp) {
        let variants = [
            (op, e) => [
                `${op} dest,#${e & 0xFF}`,
            ],
            (op, e) => [
                `MOV exp,#${e & 0xFF}`,
                `${op} dest,exp`,
            ],
            (op, e) => [
                `MOV dest,#${e & 0xFF}`,
                `${op} dest,dest`,
            ],
        ];
        return (op, fn) => exp().map((e) => variants.map((v) => [v(op, e), fn(e)])).flat();
    }

    function binary(lhs, rhs) {
        let variants = [
            (op, l, r) => [
                `${op} dest,#${l & 0xFF},#${r & 0xFF}`,
            ],
            (op, l, r) => [
                `MOV lhs,#${l & 0xFF}`,
                `${op} dest,lhs,#${r & 0xFF}`,
            ],
            (op, l, r) => [
                `MOV rhs,#${r & 0xFF}`,
                `${op} dest,#${l & 0xFF},rhs`,
            ],
            (op, l, r) => [
                `MOV lhs,#${l & 0xFF}`,
                `MOV rhs,#${r & 0xFF}`,
                `${op} dest,lhs,rhs`,
            ],
            (op, l, r) => [
                `MOV dest,#${l & 0xFF}`,
                `MOV rhs,#${r & 0xFF}`,
                `${op} dest,dest,rhs`,
            ],
            (op, l, r) => [
                `MOV lhs,#${l & 0xFF}`,
                `MOV dest,#${r & 0xFF}`,
                `${op} dest,lhs,dest`,
            ],
            (op, l, r) => (l === r ? [
                `MOV exp,#${l & 0xFF}`,
                `${op} dest,exp,exp`,
            ] : []),
            (op, l, r) => (l === r ? [
                `MOV dest,#${l & 0xFF}`,
                `${op} dest,dest,dest`,
            ] : []),
        ];
        return (op, fn) => rhs().map((r) => lhs().map((l) => variants.map((v) => [v(op, l, r), fn(l, r)]).filter(([e]) => e.length)).flat()).flat();
    }

    const scenarios = [
        ['NEG', unary(byte), (a) => -a & 0xFF],
        ['INV', unary(byte), (a) => ~a & 0xFF],
        ['MOV', unary(byte), (a) => a & 0xFF],
        ['ADD', binary(byte, byte), (a, b) => (a + b) & 0xFF],
        ['SUB', binary(byte, byte), (a, b) => (a - b) & 0xFF],
        ['MUL', binary(byte, byte), (a, b) => (castb(a) * castb(b)) & 0xFF],
        ['DIV', binary(byte, ones), (a, b) => (castb(a) / castb(b)) & 0xFF],
        ['MOD', binary(byte, ones), (a, b) => (castb(a) % castb(b)) & 0xFF],
        ['SHL', binary(byte, nibble), (a, b) => (a << (b & 7)) & 0xFF],
        ['SHR', binary(byte, nibble), (a, b) => (a >>> (b & 7)) & 0xFF],
        ['AND', binary(byte, byte), (a, b) => (a & b) & 0xFF],
        ['OR', binary(byte, byte), (a, b) => (a | b) & 0xFF],
        ['XOR', binary(byte, byte), (a, b) => (a ^ b) & 0xFF],
        ['BOOL', unary(byte), (a) => (a ? 1 : 0)],
        ['NOT', unary(byte), (a) => (a ? 0 : 1)],
        ['LT', binary(byte, byte), (a, b) => ((castb(a) < castb(b)) ? 1 : 0)],
        ['LTE', binary(byte, byte), (a, b) => ((castb(a) <= castb(b)) ? 1 : 0)],
        ['EQ', binary(byte, byte), (a, b) => ((castb(a) === castb(b)) ? 1 : 0)],
        ['NEQ', binary(byte, byte), (a, b) => ((castb(a) !== castb(b)) ? 1 : 0)],
        ['GTE', binary(byte, byte), (a, b) => ((castb(a) >= castb(b)) ? 1 : 0)],
        ['GT', binary(byte, byte), (a, b) => ((castb(a) > castb(b)) ? 1 : 0)],
    ];

    scenarios.forEach(([instruction, generator, fn]) => {
        let results = generator(instruction, fn);
        results.forEach(([expression, result]) => {
            test(`${expression.join(' ')} ${result}`, (done) => {
                expect(execute(expression.join('\n'))).toMatchObject({
                    dest: result,
                });
                done();
            });
        });
    });
});
