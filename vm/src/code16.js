import { createLabel, jcs, jeq, jlt } from './labels.js';
import operations8 from './code8.js';

const isLiteral = (val) => val.startsWith('#');
const literalValue = (val) => (val.startsWith('#$') ? +`0x${val.substring(2)}` : +val.substring(1));
const isZero = (val) => isLiteral(val) && literalValue(val) === 0;

const createUnary8 = function (opcode, [destH, destL], [srcH, srcL]) {
    if (typeof destL === 'undefined') {
        return operations8[opcode](destH, srcL);
    }
    if (destL === srcH) {
        return [
            ...operations8[opcode]('tmp_0', srcL),
            ...operations8[opcode](destH, srcH),
            'lda tmp_0',
            `sta ${destL}`,
        ];
    } else {
        return [
            ...operations8[opcode](destL, srcL),
            ...operations8[opcode](destH, srcH),
        ];
    }
};

const createBinary8 = function (opcode, [destH, destL], [lhsH, lhsL], [rhsH, rhsL]) {
    if (typeof destL === 'undefined') {
        return operations8[opcode](destH, lhsL, rhsL);
    }
    if (destL === lhsH || destL === rhsH) {
        return [
            ...operations8[opcode]('tmp_0', lhsL, rhsL),
            ...operations8[opcode](destH, lhsH, rhsH),
            'lda tmp_0',
            `sta ${destL}`,
        ];
    } else {
        return [
            ...operations8[opcode](destL, lhsL, rhsL),
            ...operations8[opcode](destH, lhsH, rhsH),
        ];
    }
};

const makeCall = function (method, [destH, destL], [lhsH, lhsL], [rhsH, rhsL]) {
    let staHigh = [];
    if (typeof destL === 'undefined') {
        destL = destH;
    } else {
        staHigh = [
            `lda ${method}_return_H`,
            `sta ${destH}`,
        ];
    }
    return [
        `lda ${rhsL}`,
        `sta ${method}_b_L`,
        `lda ${rhsH}`,
        `sta ${method}_b_H`,
        `lda ${lhsL}`,
        `sta ${method}_a_L`,
        `lda ${lhsH}`,
        `sta ${method}_a_H`,
        `jsr ${method}`,
        `lda ${method}_return_L`,
        `sta ${destL}`,
        ...staHigh,
    ];
};

const operations = {
    CAST([destH, destL], [src]) {
        return [
            `lda ${src}`,
            `sta ${destL}`,
            ...jlt([
                'lda #0',
            ], [
                'lda #$FF',
            ]),
            `sta ${destH}`,
        ];
    },
    JZ([dest], [srcH, srcL]) {
        return [
            `lda ${srcL}`,
            `ora ${srcH}`,
            `jeq ${dest}`,
        ];
    },
    JNZ([dest], [srcH, srcL]) {
        return [
            `lda ${srcL}`,
            `ora ${srcH}`,
            `jne ${dest}`,
        ];
    },
    NEG([destH, destL], [srcH, srcL]) {
        if (typeof destL === 'undefined') {
            return operations8.NEG(destH, srcL);
        }
        let overwrite = [];
        if (destL === srcH) {
            overwrite = [
                'lda tmp_0',
                `sta ${destL}`,
            ];
            destL = 'tmp_0';
        }
        return [
            'lda #0',
            `sub ${srcL}`,
            `sta ${destL}`,
            ...jcs([
                `lda ${srcH}`,
                'xor #$FF',
            ], [
                'lda #0',
                `sub ${srcH}`,
            ]),
            `sta ${destH}`,
            ...overwrite,
        ];
    },
    INV(dest, src) {
        return createUnary8('INV', dest, src);
    },
    MOV(dest, src) {
        return createUnary8('MOV', dest, src);
    },
    ADD([destH, destL], [lhsH, lhsL], [rhsH, rhsL]) {
        if (typeof destL === 'undefined') {
            return operations8.ADD(destH, lhsL, rhsL);
        }
        let overwrite = [];
        if (destL === lhsH || destL === rhsH) {
            overwrite = [
                'lda tmp_0',
                `sta ${destL}`,
            ];
            destL = 'tmp_0';
        }
        return [
            `lda ${rhsL}`,
            `add ${lhsL}`,
            `sta ${destL}`,
            ...jcs([
                `lda ${rhsH}`,
            ], [
                `lda ${rhsH}`,
                'add #1',
            ]),
            `add ${lhsH}`,
            `sta ${destH}`,
            ...overwrite,
        ];
    },
    SUB([destH, destL], [lhsH, lhsL], [rhsH, rhsL]) {
        if (typeof destL === 'undefined') {
            return operations8.SUB(destH, lhsL, rhsL);
        }
        let overwrite = [];
        if (destL === lhsH || destL === rhsH) {
            overwrite = [
                'lda tmp_0',
                `sta ${destL}`,
            ];
            destL = 'tmp_0';
        }
        return [
            `lda ${lhsL}`,
            `sub ${rhsL}`,
            `sta ${destL}`,
            ...jcs([
                `lda ${rhsH}`,
                'xor #$FF',
                `add ${lhsH}`,
            ], [
                `lda ${lhsH}`,
                `sub ${rhsH}`,
            ]),
            `sta ${destH}`,
            ...overwrite,
        ];
    },
    MUL(dest, lhs, rhs) {
        if (typeof dest[1] === 'undefined') {
            return operations8.MUL(dest[0], lhs[1], rhs[1]);
        }
        return makeCall('mul16', dest, lhs, rhs);
    },
    DIV(dest, lhs, rhs) {
        return makeCall('div16', dest, lhs, rhs);
    },
    MOD(dest, lhs, rhs) {
        return makeCall('mod16', dest, lhs, rhs);
    },
    SHL([destH, destL], [lhsH, lhsL], [rhs]) {
        if (isLiteral(rhs) && (literalValue(rhs) & 0x0F) >= 8) {
            if (typeof destL === 'undefined') {
                return [
                    'lda #0',
                    `sta ${destH}`,
                ];
            }
            return [
                ...operations8.SHL(destH, lhsL, rhs),
                'lda #0',
                `sta ${destL}`,
            ];
        } else if (isLiteral(rhs) && (literalValue(rhs) & 0x0F) === 1) {
            if (typeof destL === 'undefined') {
                return operations8.SHL(destH, lhsL, rhs);
            }
            return [
                `lda ${lhsL}`,
                'shl',
                `sta ${destL}`,
                ...jcs([
                    `lda ${lhsH}`,
                    'shl',
                ], [
                    `lda ${lhsH}`,
                    'shl',
                    'ora #1',
                ]),
                `sta ${destH}`,
            ];
        } else {
            if (typeof destL === 'undefined') {
                destL = destH;
                destH = 'tmp_1';
            }
            let setup = [
                `lda ${lhsL}`,
                `sta ${destL}`,
                `lda ${lhsH}`,
                `sta ${destH}`,
            ];
            if (destL === lhsH) {
                setup = [
                    `lda ${lhsL}`,
                    'sta tmp_1',
                    `lda ${lhsH}`,
                    `sta ${destH}`,
                    'lda tmp_1',
                    `sta ${destL}`,
                ];
            }
            let label = createLabel();
            return [
                `lda ${rhs}`,
                'and #$0F',
                'sta tmp_0',
                ...setup,
                'lda tmp_0',
                ...jeq([
                    `${label}:`,
                    `lda ${destL}`,
                    'shl',
                    `sta ${destL}`,
                    ...jcs([
                        `lda ${destH}`,
                        'shl',
                    ], [
                        `lda ${destH}`,
                        'shl',
                        'ora #1',
                    ]),
                    `sta ${destH}`,
                    'lda tmp_0',
                    'sub #1',
                    'sta tmp_0',
                    `jne ${label}`,
                ]),
            ];
        }
    },
    SHR([destH, destL], [lhsH, lhsL], [rhs]) {
        if (isLiteral(rhs) && (literalValue(rhs) & 0x0F) >= 8) {
            let staHigh = [
                'lda #0',
                `sta ${destH}`,
            ];
            if (typeof destL === 'undefined') {
                destL = destH;
                staHigh = [];
            }
            return [
                ...operations8.SHR(destL, lhsH, rhs),
                ...staHigh,
            ];
        } else if (isLiteral(rhs) && (literalValue(rhs) & 0x0F) === 1) {
            let staHigh = [
                `sta ${destH}`,
            ];
            if (typeof destL === 'undefined') {
                destL = destH;
                staHigh = [];
            }
            return [
                `lda ${lhsH}`,
                'shr',
                ...staHigh,
                ...jcs([
                    `lda ${lhsL}`,
                    'shr',
                ], [
                    `lda ${lhsL}`,
                    'shr',
                    'ora #$80',
                ]),
                `sta ${destL}`,
            ];
        } else {
            if (typeof destL === 'undefined') {
                destL = destH;
                destH = 'tmp_1';
            }
            let setup = [
                `lda ${lhsL}`,
                `sta ${destL}`,
                `lda ${lhsH}`,
                `sta ${destH}`,
            ];
            if (destL === lhsH) {
                setup = [
                    `lda ${lhsL}`,
                    'sta tmp_1',
                    `lda ${lhsH}`,
                    `sta ${destH}`,
                    'lda tmp_1',
                    `sta ${destL}`,
                ];
            }
            let label = createLabel();
            return [
                `lda ${rhs}`,
                'and #$0F',
                'sta tmp_0',
                ...setup,
                'lda tmp_0',
                ...jeq([
                    `${label}:`,
                    `lda ${destH}`,
                    'shr',
                    `sta ${destH}`,
                    ...jcs([
                        `lda ${destL}`,
                        'shr',
                    ], [
                        `lda ${destL}`,
                        'shr',
                        'ora #$80',
                    ]),
                    `sta ${destL}`,
                    'lda tmp_0',
                    'sub #1',
                    'sta tmp_0',
                    `jne ${label}`,
                ]),
            ];
        }
    },
    AND(dest, lhs, rhs) {
        return createBinary8('AND', dest, lhs, rhs);
    },
    OR(dest, lhs, rhs) {
        return createBinary8('OR', dest, lhs, rhs);
    },
    XOR(dest, lhs, rhs) {
        return createBinary8('XOR', dest, lhs, rhs);
    },
    BOOL([dest], [srcH, srcL]) {
        return [
            `lda ${srcL}`,
            `ora ${srcH}`,
            ...jeq([
                'lda #1',
            ]),
            `sta ${dest}`,
        ];
    },
    NOT([dest], [srcH, srcL]) {
        return [
            `lda ${srcL}`,
            `ora ${srcH}`,
            ...jeq([
                'lda #255',
            ]),
            'add #1',
            `sta ${dest}`,
        ];
    },
    LT([dest], [lhsH, lhsL], [rhsH, rhsL]) {
        if (isZero(rhsH) && isZero(rhsL)) {
            const labelTrue = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhsH}`,
                `jlt ${labelTrue}`,
                'lda #0',
                `jmp ${labelEnd}`,
                `${labelTrue}:`,
                'lda #1',
                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        } else if (isZero(lhsH) && isZero(lhsL)) {
            const labelFalse = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${rhsH}`,
                `jlt ${labelFalse}`,
                `ora ${rhsL}`,
                `jeq ${labelFalse}`,
                'lda #1',
                `jmp ${labelEnd}`,
                `${labelFalse}:`,
                'lda #0',
                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        } else {
            const labelSign = createLabel();
            const labelTrue = createLabel();
            const labelFalse = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhsH}`,
                `xor ${rhsH}`,
                `jlt ${labelSign}`,

                `lda ${lhsH}`,
                `sub ${rhsH}`,
                `jlt ${labelTrue}`,
                `jne ${labelFalse}`,

                `lda ${lhsL}`,
                `sub ${rhsL}`,
                `jnc ${labelTrue}`,

                'lda #0',
                `jmp ${labelEnd}`,

                `${labelSign}:`,
                `lda ${lhsH}`,
                `jlt ${labelTrue}`,

                `${labelFalse}:`,
                'lda #0',
                `jmp ${labelEnd}`,

                `${labelTrue}:`,
                'lda #1',

                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        }
    },
    LTE([dest], [lhsH, lhsL], [rhsH, rhsL]) {
        if (isZero(rhsH) && isZero(rhsL)) {
            const labelTrue = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhsH}`,
                `jlt ${labelTrue}`,
                `ora ${lhsL}`,
                `jeq ${labelTrue}`,
                'lda #0',
                `jmp ${labelEnd}`,
                `${labelTrue}:`,
                'lda #1',
                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        } else if (isZero(lhsH) && isZero(lhsL)) {
            const labelFalse = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${rhsH}`,
                `jlt ${labelFalse}`,
                'lda #1',
                `jmp ${labelEnd}`,
                `${labelFalse}:`,
                'lda #0',
                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        } else {
            const labelSign = createLabel();
            const labelTrue = createLabel();
            const labelFalse = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhsH}`,
                `xor ${rhsH}`,
                `jlt ${labelSign}`,

                `lda ${lhsH}`,
                `sub ${rhsH}`,
                `jlt ${labelTrue}`,
                `jne ${labelFalse}`,

                `lda ${lhsL}`,
                `sub ${rhsL}`,
                `jnc ${labelTrue}`,
                `jeq ${labelTrue}`,

                'lda #0',
                `jmp ${labelEnd}`,

                `${labelSign}:`,
                `lda ${lhsH}`,
                `jlt ${labelTrue}`,

                `${labelFalse}:`,
                'lda #0',
                `jmp ${labelEnd}`,

                `${labelTrue}:`,
                'lda #1',

                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        }
    },
    EQ([dest], [lhsH, lhsL], [rhsH, rhsL]) {
        const falseLabel = createLabel();
        const trueLabel = createLabel();
        return [
            `lda ${rhsL}`,
            `sub ${lhsL}`,
            `jne ${falseLabel}`,
            `lda ${rhsH}`,
            `sub ${lhsH}`,
            `jeq ${trueLabel}`,
            `${falseLabel}:`,
            'lda #255',
            `${trueLabel}:`,
            'add #1',
            `sta ${dest}`,
        ];
    },
    NEQ([dest], [lhsH, lhsL], [rhsH, rhsL]) {
        const falseLabel = createLabel();
        const trueLabel = createLabel();
        return [
            `lda ${rhsL}`,
            `sub ${lhsL}`,
            `jne ${trueLabel}`,
            `lda ${rhsH}`,
            `sub ${lhsH}`,
            `jeq ${falseLabel}`,
            `${trueLabel}:`,
            'lda #1',
            `${falseLabel}:`,
            `sta ${dest}`,
        ];
    },
    GTE(dest, lhs, rhs) {
        return operations.LTE(dest, rhs, lhs);
    },
    GT(dest, lhs, rhs) {
        return operations.LT(dest, rhs, lhs);
    },
    GET([destH, destL], [array], [index]) {
        const addressL = createLabel();
        const addressH = createLabel();
        return [
            `lda ${index}`,
            `sta ${addressL}+1`,
            'add #$01',
            `sta ${addressH}+1`,
            `${addressL}:`,
            `lda ${array}`,
            `sta ${destL}`,
            `${addressH}:`,
            `lda ${array}`,
            `sta ${destH}`,
        ];
    },
    PUT([array], [index], [srcH, srcL]) {
        const addressL = createLabel();
        const addressH = createLabel();
        return [
            `lda ${index}`,
            `sta ${addressL}+1`,
            'add #$01',
            `sta ${addressH}+1`,
            `lda ${srcL}`,
            `${addressL}:`,
            `sta ${array}`,
            `lda ${srcH}`,
            `${addressH}:`,
            `sta ${array}`,
        ];
    },
};

export default operations;
