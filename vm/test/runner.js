const cs = 1;
const zr = 2;
const ng = 4;

const execute = function (instructions, memory) {
    let pc = 0;
    let flags = 0;
    let acc = 0;
    let returns = {};

    instructions = [
        'jmp __main__',
        'mul8:',
        'lda #1',
        'sta mul8_flag',
        'lda #0',
        'sta mul8_res',
        'mul8_vm_0:',
        'lda mul8_flag',
        'jeq mul8_vm_1',
        'lda mul8_b',
        'and mul8_flag',
        'sta mul8_0',
        'lda mul8_0',
        'jeq mul8_vm_3',
        'lda mul8_a',
        'add mul8_res',
        'sta mul8_res',
        'mul8_vm_3:',
        'lda mul8_a',
        'shl',
        'sta mul8_a',
        'lda mul8_flag',
        'shl',
        'sta mul8_flag',
        'jmp mul8_vm_0',
        'mul8_vm_1:',
        'lda mul8_res',
        'sta mul8_return',
        'mul8_end:',
        'ret mul8',
        'div8:',
        'lda #0',
        'sta div8_q',
        'lda #0',
        'sta div8_r',
        'lda #0',
        'sta div8_sign',
        'lda div8_a',
        'jlt div8_asm_0',
        'lda #0',
        'jmp div8_asm_1',
        'div8_asm_0:',
        'lda #1',
        'div8_asm_1:',
        'sta div8_0',
        'lda div8_0',
        'jeq div8_vm_1',
        'lda #0',
        'sub div8_a',
        'sta div8_a',
        'lda #1',
        'sta div8_sign',
        'div8_vm_1:',
        'lda div8_b',
        'jlt div8_asm_2',
        'lda #0',
        'jmp div8_asm_3',
        'div8_asm_2:',
        'lda #1',
        'div8_asm_3:',
        'sta div8_0',
        'lda div8_0',
        'jeq div8_vm_3',
        'lda #0',
        'sub div8_b',
        'sta div8_b',
        'lda #1',
        'xor div8_sign',
        'sta div8_sign',
        'div8_vm_3:',
        'lda #128',
        'sta div8_flag',
        'div8_vm_4:',
        'lda div8_flag',
        'jeq div8_vm_5',
        'lda div8_r',
        'shl',
        'sta div8_r',
        'lda div8_a',
        'and div8_flag',
        'sta div8_0',
        'lda div8_0',
        'jeq div8_vm_7',
        'lda #1',
        'ora div8_r',
        'sta div8_r',
        'div8_vm_7:',
        'lda div8_r',
        'xor div8_b',
        'jlt div8_asm_4',
        'lda div8_r',
        'sub div8_b',
        'jge div8_asm_5',
        'lda #0',
        'jmp div8_asm_6',
        'div8_asm_4:',
        'lda div8_r',
        'jge div8_asm_5',
        'lda #0',
        'jmp div8_asm_6',
        'div8_asm_5:',
        'lda #1',
        'div8_asm_6:',
        'sta div8_0',
        'lda div8_0',
        'jeq div8_vm_9',
        'lda div8_r',
        'sub div8_b',
        'sta div8_r',
        'lda div8_flag',
        'ora div8_q',
        'sta div8_q',
        'div8_vm_9:',
        'lda div8_flag',
        'shr',
        'sta div8_flag',
        'jmp div8_vm_4',
        'div8_vm_5:',
        'lda div8_sign',
        'jeq div8_vm_10',
        'lda #0',
        'sub div8_q',
        'sta div8_0',
        'jmp div8_vm_11',
        'div8_vm_10:',
        'lda div8_q',
        'sta div8_0',
        'div8_vm_11:',
        'lda div8_0',
        'sta div8_return',
        'div8_end:',
        'ret div8',
        'mod8:',
        'lda #0',
        'sta mod8_q',
        'lda #0',
        'sta mod8_r',
        'lda #0',
        'sta mod8_sign',
        'lda mod8_a',
        'jlt mod8_asm_7',
        'lda #0',
        'jmp mod8_asm_8',
        'mod8_asm_7:',
        'lda #1',
        'mod8_asm_8:',
        'sta mod8_0',
        'lda mod8_0',
        'jeq mod8_vm_1',
        'lda #0',
        'sub mod8_a',
        'sta mod8_a',
        'lda #1',
        'sta mod8_sign',
        'mod8_vm_1:',
        'lda mod8_b',
        'jlt mod8_asm_9',
        'lda #0',
        'jmp mod8_asm_10',
        'mod8_asm_9:',
        'lda #1',
        'mod8_asm_10:',
        'sta mod8_0',
        'lda mod8_0',
        'jeq mod8_vm_3',
        'lda #0',
        'sub mod8_b',
        'sta mod8_b',
        'mod8_vm_3:',
        'lda #128',
        'sta mod8_flag',
        'mod8_vm_4:',
        'lda mod8_flag',
        'jeq mod8_vm_5',
        'lda mod8_r',
        'shl',
        'sta mod8_r',
        'lda mod8_a',
        'and mod8_flag',
        'sta mod8_0',
        'lda mod8_0',
        'jeq mod8_vm_7',
        'lda #1',
        'ora mod8_r',
        'sta mod8_r',
        'mod8_vm_7:',
        'lda mod8_r',
        'xor mod8_b',
        'jlt mod8_asm_11',
        'lda mod8_r',
        'sub mod8_b',
        'jge mod8_asm_12',
        'lda #0',
        'jmp mod8_asm_13',
        'mod8_asm_11:',
        'lda mod8_r',
        'jge mod8_asm_12',
        'lda #0',
        'jmp mod8_asm_13',
        'mod8_asm_12:',
        'lda #1',
        'mod8_asm_13:',
        'sta mod8_0',
        'lda mod8_0',
        'jeq mod8_vm_9',
        'lda mod8_r',
        'sub mod8_b',
        'sta mod8_r',
        'lda mod8_flag',
        'ora mod8_q',
        'sta mod8_q',
        'mod8_vm_9:',
        'lda mod8_flag',
        'shr',
        'sta mod8_flag',
        'jmp mod8_vm_4',
        'mod8_vm_5:',
        'lda mod8_sign',
        'jeq mod8_vm_10',
        'lda #0',
        'sub mod8_r',
        'sta mod8_0',
        'jmp mod8_vm_11',
        'mod8_vm_10:',
        'lda mod8_r',
        'sta mod8_0',
        'mod8_vm_11:',
        'lda mod8_0',
        'sta mod8_return',
        'mod8_end:',
        'ret mod8',
        'shl8:',
        'lda #7',
        'and shl8_b',
        'sta shl8_b',
        'shl8_vm_0:',
        'lda shl8_b',
        'jeq shl8_vm_1',
        'lda shl8_a',
        'shl',
        'sta shl8_a',
        'lda shl8_b',
        'sub #1',
        'sta shl8_b',
        'jmp shl8_vm_0',
        'shl8_vm_1:',
        'lda shl8_a',
        'sta shl8_return',
        'shl8_end:',
        'ret shl8',
        'shr8:',
        'lda #7',
        'and shr8_b',
        'sta shr8_b',
        'shr8_vm_0:',
        'lda shr8_b',
        'jeq shr8_vm_1',
        'lda shr8_a',
        'shr',
        'sta shr8_a',
        'lda shr8_b',
        'sub #1',
        'sta shr8_b',
        'jmp shr8_vm_0',
        'shr8_vm_1:',
        'lda shr8_a',
        'sta shr8_return',
        'shr8_end:',
        'ret shr8',
        '__main__:',
        ...instructions,
    ];

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
    function svalue(param) {
        let v = value(param);
        return v > 127 ? v - 256 : v;
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
                let dest = addressOf(param);
                if (dest >= 0) {
                    returns[param] = pc + 1;
                    pc = dest;
                } else {
                    switch (param) {
                        case 'mul8':
                            acc = (svalue('mul8_a') * svalue('mul8_b')) & 0xFF;
                            break;
                        case 'div8':
                            acc = (svalue('div8_a') / svalue('div8_b')) & 0xFF;
                            break;
                        case 'mod8':
                            acc = (svalue('mod8_a') % svalue('mod8_b')) & 0xFF;
                            break;
                        case 'shl8':
                            acc = (value('shl8_a') << (value('shl8_b') & 0x07)) & 0xFF;
                            break;
                        case 'shl8':
                            acc = (value('shl8_a') >>> (value('shl8_b') & 0x07)) & 0xFF;
                            break;
                        default:
                            throw new Error(`Unknown subroutine ${param}`);
                    }
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
