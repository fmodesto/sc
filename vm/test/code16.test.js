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

    function genUnaryInt(instruction, fn) {
        let data = [];
        for (let i = 0; i < 256; i += 51) {
            for (let j = 0; j < 256; j += 51) {
                data.push([`${instruction} destH:destL,#${i}:#${j}`, fn(i << 8 | j)]);
            }
        }
        return data;
    }

    function genBinaryInt(instruction, fn) {
        let data = [];
        for (let i = 0; i < 256; i += 85) {
            for (let j = 0; j < 256; j += 85) {
                for (let k = 0; k < 256; k += 85) {
                    for (let l = 0; l < 256; l += 85) {
                        data.push([`${instruction} destH:destL,#${i}:#${j},#${k}:#${l}`, fn(i << 8 | j, k << 8 | l)]);
                    }
                }
            }
        }
        return data;
    }

    function genBinaryShift(instruction, fn) {
        let data = [];
        for (let i = 0; i < 256; i += 85) {
            for (let j = 0; j < 256; j += 85) {
                for (let k = 0; k < 17; k += 85) {
                    data.push([`${instruction} destH:destL,#${i}:#${j},#${k}`, fn(i << 8 | j, k)]);
                }
            }
        }
        return data;
    }

    function genBinaryDiv(instruction, fn) {
        let data = [];
        for (let i = 0; i < 256; i += 85) {
            for (let j = 0; j < 256; j += 85) {
                for (let k = 0; k < 256; k += 85) {
                    for (let l = 0; l < 256; l += 85) {
                        data.push([`${instruction} destH:destL,#${i}:#${j},#${k}:#${(k || l) ? l : 1}`, fn(i << 8 | j, (k || l) ? k << 8 | l : 1)]);
                    }
                }
            }
        }
        return data;
    }

    function genUnary(instruction, fn) {
        let data = [];
        for (let i = 0; i < 256; i += 51) {
            for (let j = 0; j < 256; j += 51) {
                data.push([`${instruction} dest,#${i}:#${j}`, fn(i << 8 | j)]);
            }
        }
        return data;
    }

    function genBinary(instruction, fn) {
        let data = [];
        for (let i = 0; i < 256; i += 85) {
            for (let j = 0; j < 256; j += 85) {
                for (let k = 0; k < 256; k += 85) {
                    for (let l = 0; l < 256; l += 85) {
                        data.push([`${instruction} dest,#${i}:#${j},#${k}:#${l}`, fn(i << 8 | j, k << 8 | l)]);
                    }
                }
            }
        }
        return data;
    }

    const intScenarios = [
        ['NEG', genUnaryInt, (a) => -a & 0xFFFF],
        ['INV', genUnaryInt, (a) => ~a & 0xFFFF],
        ['MOV', genUnaryInt, (a) => a & 0xFFFF],
        ['ADD', genBinaryInt, (a, b) => (a + b) & 0xFFFF],
        ['SUB', genBinaryInt, (a, b) => (a - b) & 0xFFFF],
        ['MUL', genBinaryInt, (a, b) => (castw(a) * castw(b)) & 0xFFFF],
        ['DIV', genBinaryDiv, (a, b) => (castw(a) / castw(b)) & 0xFFFF],
        ['MOD', genBinaryDiv, (a, b) => (castw(a) % castw(b)) & 0xFFFF],
        ['SHL', genBinaryShift, (a, b) => (a << (b & 0x0F)) & 0xFFFF],
        ['SHR', genBinaryShift, (a, b) => (a >>> (b & 0x0F)) & 0xFFFF],
        ['AND', genBinaryInt, (a, b) => (a & b) & 0xFFFF],
        ['OR', genBinaryInt, (a, b) => (a | b) & 0xFFFF],
        ['XOR', genBinaryInt, (a, b) => (a ^ b) & 0xFFFF],
    ];

    intScenarios.forEach(([instruction, generator, fn]) => {
        let results = generator(instruction, fn);
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
        ['BOOL', genUnary, (a) => (a ? 1 : 0)],
        ['NOT', genUnary, (a) => (a ? 0 : 1)],
        // ['LT', genBinary, (a, b) => ((castw(a) < castw(b)) ? 1 : 0)],
        // ['LTE', genBinary, (a, b) => ((castw(a) <= castw(b)) ? 1 : 0)],
        ['EQ', genBinary, (a, b) => ((castw(a) === castw(b)) ? 1 : 0)],
        ['NEQ', genBinary, (a, b) => ((castw(a) !== castw(b)) ? 1 : 0)],
        // ['GTE', genBinary, (a, b) => ((castw(a) >= castw(b)) ? 1 : 0)],
        // ['GT', genBinary, (a, b) => ((castw(a) > castw(b)) ? 1 : 0)],
    ];

    scenarios.forEach(([instruction, generator, fn]) => {
        let results = generator(instruction, fn);
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
