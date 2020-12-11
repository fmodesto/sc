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

describe('Generates code', () => {

    function genUnary(instruction, fn) {
        let data = [];
        for (let i = 0; i < 256; i += 17) {
            data.push([`${instruction} dest,#${i}`, fn(i)]);
        }
        return data;
    }

    function genBinary(instruction, fn) {
        let data = [];
        for (let i = 0; i < 256; i += 51) {
            for (let j = 0; j < 256; j += 51) {
                data.push([`${instruction} dest,#${i},#${j}`, fn(i, j)]);
            }
        }
        return data;
    }

    function genBinaryDiv(instruction, fn) {
        let data = [];
        for (let i = 0; i < 256; i += 51) {
            for (let j = 0; j < 256; j += 51) {
                data.push([`${instruction} dest,#${i},#${j ? j : 1}`, fn(i, j ? j : 1)]);
            }
        }
        return data;
    }

    const scenarios = [
        ['NEG', genUnary, (a) => -a & 0xFF],
        ['INV', genUnary, (a) => ~a & 0xFF],
        ['NOT', genUnary, (a) => (a ? 0 : 1)],
        ['MOV', genUnary, (a) => a & 0xFF],
        ['ADD', genBinary, (a, b) => (a + b) & 0xFF],
        ['SUB', genBinary, (a, b) => (a - b) & 0xFF],
        ['MUL', genBinary, (a, b) => (castb(a) * castb(b)) & 0xFF],
        ['DIV', genBinaryDiv, (a, b) => (castb(a) / castb(b)) & 0xFF],
        ['MOD', genBinaryDiv, (a, b) => (castb(a) % castb(b)) & 0xFF],
        ['SHL', genBinary, (a, b) => (a << (b & 7)) & 0xFF],
        ['SHR', genBinary, (a, b) => (a >>> (b & 7)) & 0xFF],
        ['AND', genBinary, (a, b) => (a & b) & 0xFF],
        ['OR', genBinary, (a, b) => (a | b) & 0xFF],
        ['XOR', genBinary, (a, b) => (a ^ b) & 0xFF],
        ['LT', genBinary, (a, b) => ((castb(a) < castb(b)) ? 1 : 0)],
        ['LTE', genBinary, (a, b) => ((castb(a) <= castb(b)) ? 1 : 0)],
        ['EQ', genBinary, (a, b) => ((castb(a) === castb(b)) ? 1 : 0)],
        ['NEQ', genBinary, (a, b) => ((castb(a) !== castb(b)) ? 1 : 0)],
        ['GTE', genBinary, (a, b) => ((castb(a) >= castb(b)) ? 1 : 0)],
        ['GT', genBinary, (a, b) => ((castb(a) > castb(b)) ? 1 : 0)],
    ];

    scenarios.forEach(([instruction, generator, fn]) => {
        let results = generator(instruction, fn);
        results.forEach(([expression, result]) => {
            test(`${expression} ${result}`, (done) => {
                expect(execute(expression)).toMatchObject({
                    dest: result,
                });
                done();
            });
        });
    });
});
