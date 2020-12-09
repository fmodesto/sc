const byte = function (value) {
    value &= 0xFF;
    return value >= 128 ? value - 256 : value;
};

const word = function (value) {
    value &= 0xFFFF;
    return value >= 32768 ? value - 65536 : value;
};

export {
    byte,
    word,
};
