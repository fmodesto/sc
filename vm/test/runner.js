const cs = 1;
const zr = 2;
const ng = 4;

const execute = function (instructions, memory) {
    let pc = 0;
    let flags = 0;
    let acc = 0;

    // instructions = instructions.filter((e) => !e.startsWith(';'));

    function addressOf(param) {
        return instructions.indexOf(`${param}:`);
    }
    function value(param) {
        if (param.startsWith('#')) {
            return (+param.substring(1) & 0xFF);
        } else {
            return memory[param] & 0xFF;
        }
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
                acc += (~value(param) + 1);
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
                switch (param) {
                    case 'mul8':
                        acc = (value('_op1') * value('_op2')) & 0xFF;
                        break;
                    case 'div8':
                        acc = (value('_op1') / value('_op2')) & 0xFF;
                        break;
                    case 'mod8':
                        acc = (value('_op1') % value('_op2')) & 0xFF;
                        break;
                    case 'shl8':
                        acc = (value('_op1') << value('_op2')) & 0xFF;
                        break;
                    case 'shl8':
                        acc = (value('_op1') >>> value('_op2')) & 0xFF;
                        break;
                    default:
                        acc = 0xFF;
                        break;
                }
                updateFlags();
                pc += 1;
                break;
            default:
                pc += 1;
                break;
        }
    }
};

export default execute;
