const byte = function (value) {
    value &= 0xFF;
    return value >= 128 ? value - 256 : value;
};

const word = function (value) {
    value &= 0xFFFF;
    return value >= 32768 ? value - 65536 : value;
};

const nearPower = function (e) {
    let s = 1;
    while (s < e) {
        s <<= 1;
    }
    return s;
};

const isPowerOfTwo = function (e) {
    return !(e & (e-1));
};

const logTwo = function (e) {
    let s = 1;
    let count = 0;
    while (s < e) {
        s <<= 1;
        count += 1;
    }
    return count;
};

export {
    byte,
    word,
    nearPower,
    isPowerOfTwo,
    logTwo,
};
