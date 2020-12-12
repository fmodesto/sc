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

describe('Generates code', () => {

    function word() {
        let data = [];
        for (let i = 0; i < 256; i+=85) {
            for (let j = 0; j < 256; j+=85) {
                data.push(i << 8 | j);
            }
        }
        return data;
    }

    function ones() {
        let data = [];
        for (let i = 0; i < 256; i+=85) {
            for (let j = 0; j < 256; j+=85) {
                data.push(i || j ? i << 8 | j : 1);
            }
        }
        return data;
    }

    function byte() {
        let data = [];
        for (let i = 0; i < (1 << 8); i+=17) {
            data.push(i);
        }
        return data;
    }

    function nibble() {
        let data = [];
        for (let i = 0; i <= 17; i++) {
            data.push(i);
        }
        return data;
    }

    function unary(exp) {
        return (opcode, dest, fn) => exp().map((e) => [`${opcode} ${dest},#${(e >> 8) & 0xFF}:#${e & 0xFF}`, fn(e)]);
    }

    function binary(lhs, rhs) {
        return (opcode, dest, fn) => rhs().map((r) => lhs().map((l) => [`${opcode} ${dest},#${(l >> 8) & 0xFF}:#${l & 0xFF},#${(r >> 8) & 0xFF}:#${r & 0xFF}`, fn(l, r)])).flat();
    }

    function shift(lhs, rhs) {
        return (opcode, dest, fn) => rhs().map((r) => lhs().map((l) => [`${opcode} ${dest},#${(l >> 8) & 0xFF}:#${l & 0xFF},#${r & 0xFF}`, fn(l, r)])).flat();
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

    intScenarios.forEach(([opcode, generator, fn]) => {
        let results = generator(opcode, 'destH:destL', fn);
        results.forEach(([expression, result]) => {
            test.only(`${expression} ${result}`, (done) => {
                expect(execute(expression)).toMatchObject({
                    destH: result >> 8 & 0xFF,
                    destL: result & 0xFF,
                });
                done();
            });
        });
    });

    const scenarios = [
        ['BOOL', unary(word), (a) => (a ? 1 : 0)],
        ['NOT', unary(word), (a) => (a ? 0 : 1)],
        // ['LT', genBinary, (a, b) => ((castw(a) < castw(b)) ? 1 : 0)],
        // ['LTE', genBinary, (a, b) => ((castw(a) <= castw(b)) ? 1 : 0)],
        ['EQ', binary(word, word), (a, b) => ((castw(a) === castw(b)) ? 1 : 0)],
        ['NEQ', binary(word, word), (a, b) => ((castw(a) !== castw(b)) ? 1 : 0)],
        // ['GTE', genBinary, (a, b) => ((castw(a) >= castw(b)) ? 1 : 0)],
        // ['GT', genBinary, (a, b) => ((castw(a) > castw(b)) ? 1 : 0)],
    ];

    scenarios.forEach(([opcode, generator, fn]) => {
        let results = generator(opcode, 'dest', fn);
        results.forEach(([expression, result]) => {
            test.only(`${expression} ${result}`, (done) => {
                expect(execute(expression)).toMatchObject({
                    dest: result,
                });
                done();
            });
        });
    });
});
