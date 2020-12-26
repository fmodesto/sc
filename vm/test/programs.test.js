import { readFileSync } from 'fs';
import parse from '../src/parser.js';
import optimize from '../src/optimizer.js';
import codegen from '../src/codegen.js';
import runner from './runner.js';

let cache = {};

const int = (x) => (x & 0x8000 ? x - (1 << 16) : x);
const char = (x) => (x & 0x80 ? x - (1 << 8) : x);
const load = function (filename) {
    if (!(filename in cache)) {
        let code = readFileSync(filename, 'utf-8');
        let program = parse(code);
        let optimized = optimize(program);
        let bytecode = codegen(optimized);
        cache[filename] = bytecode;
    }
    return cache[filename];
};

const execute = (code, memory = {}) => {
    runner(code, memory);
    return memory;
};

const sqrt = function (x) {
    let code = [
        'jsr sqrt',
        'jmp _end_',
        ...load('vm/test/programs/sqrt.vm'),
        '_end_:',
    ];
    let mem = execute(code, {
        sqrt_x_H: x >> 8 & 0xFF,
        sqrt_x_L: x & 0xFF,
    });
    return int(mem.sqrt_return_H << 8 | mem.sqrt_return_L);
};

const fib = function (x) {
    let code = [
        'jsr fib',
        'jmp _end_',
        ...load('vm/test/programs/fib.vm'),
        '_end_:',
    ];
    let mem = execute(code, {
        fib_n: x,
    });
    return int(mem.fib_return_H << 8 | mem.fib_return_L);
};

const rand = function (x) {
    let code = [
        'jsr rand',
        'jmp _end_',
        ...load('vm/test/programs/rand.vm'),
        '_end_:',
    ];
    let mem = {
        seed_H: 0xAC,
        seed_L: 0xE1,
    };
    for (let i = 0; i <= x; i++)
        mem = execute(code, mem);
    return char(mem.rand_return);
};

const change = function (amount) {
    let code = [
        'jsr change',
        'jmp _end_',
        ...load('vm/test/programs/change.vm'),
        '_end_:',
    ];
    let mem = execute(code, {
        change_amount: amount,
        'coins[0]': 1,
        'coins[1]': 5,
        'coins[2]': 10,
        'coins[3]': 25,
        'coins[4]': 50,
        'coins[5]': 100,
    });
    return int(mem.change_return_H << 8 | mem.change_return_L);
};

describe('Programs', () => {

    describe('Square roots', () => {
        let values = [...Array(128).keys()];
        values.forEach((v) => {
            test(`${v * v} -> ${v}`, (done) => {
                expect(sqrt(v * v)).toEqual(v);
                done();
            });
        });
    });

    describe('Fibonacci', () => {
        const fb = (n, s = [0, 1]) => (n <= s.length ? s : fb(n, s.concat(s[s.length - 2] + s[s.length - 1])));
        const values = fb(24);
        values.forEach((f, i) => {
            test(`${i} -> ${f}`, (done) => {
                expect(fib(i)).toEqual(f);
                done();
            });
        });
    });

    describe('Change coins', () => {
        let values = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 9, 9, 9, 9, 9, 13, 13, 13, 13, 13, 18, 18, 18, 18, 18, 24, 24, 24, 24, 24, 31, 31, 31, 31, 31, 39, 39, 39, 39, 39, 50, 50, 50, 50, 50, 62, 62, 62, 62, 62, 77, 77, 77, 77, 77, 93, 93, 93, 93, 93, 112, 112, 112, 112, 112, 134, 134, 134, 134, 134, 159, 159, 159, 159, 159, 187, 187, 187, 187, 187, 218, 218, 218, 218, 218, 252, 252, 252, 252, 252, 293, 293, 293, 293, 293, 337, 337, 337, 337, 337, 388, 388, 388, 388, 388, 442, 442, 442, 442, 442, 503, 503, 503, 503, 503, 571, 571, 571];
        values.forEach((v, i) => {
            test(`${i} -> ${v}`, (done) => {
                expect(change(i)).toEqual(v);
                done();
            });
        });
    });

    describe('Random generator', () => {
        let values = [112, 56, -100, -50, 103, -77, 89, -84, 86, -85, 85, 42, 21, -118, 69, 34, -111, -56, -28, 114, 57, 28, -114, 71, -93, -47, -24, 116, -70, -35, 110, 55, 27, 13, -122, 67, 33, 16, -120, -60, -30, 113, -72, -36, -18, 119, 59, -99, -50, -25, 115, 57, 28, -114, -57, -29, -15, 120, -68, 94, -81, 87, 43, 21, 10, 5, 2, -127, 64, 32, 16, -120, 68, -94, 81, 40, -108, 74, -91, 82, -87, -44, -22, -11, 122, -67, -34, -17, 119, -69, -35, 110, -73, 91, 45, 22, 11, -123, -62, -31];
        values.forEach((v, i) => {
            test(`rnd(${i}) -> ${v}`, (done) => {
                expect(rand(i)).toEqual(v);
                done();
            });
        });
    });
});
