const cs = 1;
const zr = 2;
const ng = 4;

const execute = function (instructions, memory) {
    let pc = 0;
    let flags = 0;
    let acc = 0;
    let returns = {};

    function addressOf(param) {
        return instructions.indexOf(`${param}:`);
    }
    function value(param) {
        if (param.startsWith('#$')) {
            return (+`0x${param.substring(2)}` & 0xFF);
        } else if (param.startsWith('#')) {
            return (+param.substring(1) & 0xFF);
        } else {
            return memory[param] & 0xFF;
        }
    }
    function byte(address) {
        let v = value(address);
        return v >= (1 << 7) ? v - (1 << 8) : v;
    }
    function setByte(address, value) {
        memory[address] = value & 0xFF;
        return memory[address];
    }
    function word(address) {
        let v = value(`${address}_H`) << 8 | value(`${address}_L`);
        return v >= (1 << 15) ? v - (1 << 16) : v;
    }
    function setWord(address, value) {
        memory[`${address}_L`] = value & 0xFF;
        memory[`${address}_H`] = (value >> 8) & 0xFF;
        return memory[`${address}_H`];
    }
    function updateFlags() {
        flags = 0;
        if (acc > 255) {
            flags |= cs;
        }
        acc &= 0xFF;
        if (acc === 0) {
            flags |= zr;
        }
        if (acc > 127) {
            flags |= ng;
        }
    }

    const methods = {
        mul8() {
            return setByte('mul8_return', (byte('mul8_a') * byte('mul8_b')) & 0xFF);
        },
        div8() {
            return setByte('div8_return', (byte('div8_a') / byte('div8_b')) & 0xFF);
        },
        mod8() {
            return setByte('mod8_return', (byte('mod8_a') % byte('mod8_b')) & 0xFF);
        },
        mul16() {
            return setWord('mul16_return', (word('mul16_a') * word('mul16_b')) & 0xFFFF);
        },
        div16() {
            return setWord('div16_return', (word('div16_a') / word('div16_b')) & 0xFFFF);
        },
        mod16() {
            return setWord('mod16_return', (word('mod16_a') % word('mod16_b')) & 0xFFFF);
        },
    };

    while (pc < instructions.length) {
        let [code, param] = instructions[pc].split(' ');
        switch (code) {
            case 'jmp':
                pc = addressOf(param);
                break;
            case 'jcs':
                pc = flags & cs ? addressOf(param) : pc + 1;
                break;
            case 'jlt':
                pc = flags & ng ? addressOf(param) : pc + 1;
                break;
            case 'jeq':
                pc = flags & zr ? addressOf(param) : pc + 1;
                break;
            case 'sta':
                memory[param] = acc;
                pc += 1;
                break;
            case 'jnc':
                pc = flags & cs ? pc + 1 : addressOf(param);
                break;
            case 'jge':
                pc = flags & ng ? pc + 1 : addressOf(param);
                break;
            case 'jne':
                pc = flags & zr ? pc + 1 : addressOf(param);
                break;
            case 'add':
                acc += value(param);
                updateFlags();
                pc += 1;
                break;
            case 'shr':
                acc = acc & 1 ? 256 + (acc >>> 1) : acc >>> 1;
                updateFlags();
                pc += 1;
                break;
            case 'sub':
                acc += (~value(param) & 0xFF) + 1;
                updateFlags();
                pc += 1;
                break;
            case 'shl':
                acc <<= 1;
                updateFlags();
                pc += 1;
                break;
            case 'and':
                acc &= value(param);
                updateFlags();
                pc += 1;
                break;
            case 'lda':
                acc = value(param);
                updateFlags();
                pc += 1;
                break;
            case 'ora':
                acc |= value(param);
                updateFlags();
                pc += 1;
                break;
            case 'xor':
                acc ^= value(param);
                updateFlags();
                pc += 1;
                break;
            case 'jsr':
                let dest = addressOf(param);
                if (dest >= 0) {
                    returns[param] = pc + 1;
                    pc = dest;
                } else {
                    acc = methods[param]();
                    updateFlags();
                    pc += 1;
                }
                break;
            case 'ret':
                pc = returns[param];
                break;
            default:
                pc += 1;
                break;
        }
    }
};

export default execute;
