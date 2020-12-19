import { nearPower, isPowerOfTwo, logTwo } from '../src/binary.js';

describe('Binary utilities', () => {

    let powers = [
        [1, 1],
        [2, 2],
        [3, 4],
        [4, 4],
        [7, 8],
        [9, 16],
    ];
    powers.forEach(([val, power]) => {
        test(`Near power of two ${val} -> ${power}`, (done) => {
            expect(nearPower(val)).toEqual(power);
            done();
        });
    });

    [1, 2, 4, 8, 16, 512].forEach((val) => {
        test(`Is power of two ${val}`, (done) => {
            expect(isPowerOfTwo(val)).toEqual(true);
            done();
        });
    });

    [3, 5, 6, 7, 9, 257].forEach((val) => {
        test(`Is not power of two ${val}`, (done) => {
            expect(isPowerOfTwo(val)).toEqual(false);
            done();
        });
    });

    [0, 1, 3, 5, 7, 15].forEach((val) => {
        test(`Log two ${1 << val} -> ${val}`, (done) => {
            expect(logTwo(1 << val)).toEqual(val);
            done();
        });
    });
});
