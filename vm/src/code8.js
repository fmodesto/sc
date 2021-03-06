import { createLabel, jeq, jle, jlt } from './labels.js';

const isLiteral = (val) => val.startsWith('#');
const literalValue = (val) => (val.startsWith('#$') ? +`0x${val.substring(2)}` : +val.substring(1));
const isZero = (val) => isLiteral(val) && literalValue(val) === 0;

const operations = {
    CALL(dest) {
        return [
            `jsr ${dest}`,
        ];
    },
    JMP(dest) {
        return [
            `jmp ${dest}`,
        ];
    },
    JZ(dest, src) {
        return [
            `lda ${src}`,
            `jeq ${dest}`,
        ];
    },
    JNZ(dest, src) {
        return [
            `lda ${src}`,
            `jne ${dest}`,
        ];
    },
    CAST(dest, src) {
        return [
            `lda ${src}`,
            `sta ${dest}`,
        ];
    },
    NEG(dest, src) {
        return [
            'lda #0',
            `sub ${src}`,
            `sta ${dest}`,
        ];
    },
    INV(dest, src) {
        return [
            `lda ${src}`,
            'xor #255',
            `sta ${dest}`,
        ];
    },
    MOV(dest, src) {
        return [
            `lda ${src}`,
            `sta ${dest}`,
        ];
    },
    ADD(dest, lhs, rhs) {
        return [
            `lda ${rhs}`,
            `add ${lhs}`,
            `sta ${dest}`,
        ];
    },
    SUB(dest, lhs, rhs) {
        return [
            `lda ${lhs}`,
            `sub ${rhs}`,
            `sta ${dest}`,
        ];
    },
    MUL(dest, lhs, rhs) {
        return [
            `lda ${rhs}`,
            'sta mul8_b',
            `lda ${lhs}`,
            'sta mul8_a',
            'jsr mul8',
            'lda mul8_return',
            `sta ${dest}`,
        ];
    },
    DIV(dest, lhs, rhs) {
        return [
            `lda ${rhs}`,
            'sta div8_b',
            `lda ${lhs}`,
            'sta div8_a',
            'jsr div8',
            'lda div8_return',
            `sta ${dest}`,
        ];
    },
    MOD(dest, lhs, rhs) {
        return [
            `lda ${rhs}`,
            'sta mod8_b',
            `lda ${lhs}`,
            'sta mod8_a',
            'jsr mod8',
            'lda mod8_return',
            `sta ${dest}`,
        ];
    },
    SHL(dest, lhs, rhs) {
        if (isLiteral(rhs)) {
            let v = literalValue(rhs) & 0x07;
            let shifts = Array(v).fill('shl');
            return [
                `lda ${lhs}`,
                ...shifts,
                `sta ${dest}`,
            ];
        } else {
            let overwrite = [];
            if (dest === lhs || dest === rhs) {
                overwrite = [
                    'lda _tmp_1',
                    `sta ${dest}`,
                ];
                dest = '_tmp_1';
            }
            let label = createLabel();
            return [
                `lda ${lhs}`,
                `sta ${dest}`,
                `lda ${rhs}`,
                'and #$07',
                'sta _tmp_0',
                ...jeq([
                    `${label}:`,
                    `lda ${dest}`,
                    'shl',
                    `sta ${dest}`,
                    'lda _tmp_0',
                    'sub #1',
                    'sta _tmp_0',
                    `jne ${label}`,
                ]),
                ...overwrite,
            ];
        }
    },
    SHR(dest, lhs, rhs) {
        if (isLiteral(rhs)) {
            let v = literalValue(rhs) & 0x07;
            let shifts = Array(v).fill('shr');
            return [
                `lda ${lhs}`,
                ...shifts,
                `sta ${dest}`,
            ];
        } else {
            let overwrite = [];
            if (dest === lhs || dest === rhs) {
                overwrite = [
                    'lda _tmp_1',
                    `sta ${dest}`,
                ];
                dest = '_tmp_1';
            }
            let label = createLabel();
            return [
                `lda ${lhs}`,
                `sta ${dest}`,
                `lda ${rhs}`,
                'and #$07',
                'sta _tmp_0',
                ...jeq([
                    `${label}:`,
                    `lda ${dest}`,
                    'shr',
                    `sta ${dest}`,
                    'lda _tmp_0',
                    'sub #1',
                    'sta _tmp_0',
                    `jne ${label}`,
                ]),
                ...overwrite,
            ];
        }
    },
    AND(dest, lhs, rhs) {
        return [
            `lda ${rhs}`,
            `and ${lhs}`,
            `sta ${dest}`,
        ];
    },
    OR(dest, lhs, rhs) {
        return [
            `lda ${rhs}`,
            `ora ${lhs}`,
            `sta ${dest}`,
        ];
    },
    XOR(dest, lhs, rhs) {
        return [
            `lda ${rhs}`,
            `xor ${lhs}`,
            `sta ${dest}`,
        ];
    },
    BOOL(dest, src) {
        return [
            `lda ${src}`,
            ...jeq([
                'lda #1',
            ]),
            `sta ${dest}`,
        ];
    },
    NOT(dest, src) {
        return [
            `lda ${src}`,
            ...jeq([
                'lda #255',
            ]),
            'add #1',
            `sta ${dest}`,
        ];
    },
    LT(dest, lhs, rhs) {
        if (isZero(rhs)) {
            return [
                `lda ${lhs}`,
                ...jlt([
                    'lda #0',
                ], [
                    'lda #1',
                ]),
                `sta ${dest}`,
            ];
        } else if (isZero(lhs)) {
            return [
                `lda ${rhs}`,
                ...jle([
                    'lda #1',
                ], [
                    'lda #0',
                ]),
                `sta ${dest}`,
            ];
        } else {
            const labelSign = createLabel();
            const labelTrue = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhs}`,
                `xor ${rhs}`,
                `jlt ${labelSign}`,

                `lda ${lhs}`,
                `sub ${rhs}`,
                `jlt ${labelTrue}`,
                'lda #0',
                `jmp ${labelEnd}`,

                `${labelSign}:`,
                `lda ${lhs}`,
                `jlt ${labelTrue}`,
                'lda #0',
                `jmp ${labelEnd}`,

                `${labelTrue}:`,
                'lda #1',

                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        }
    },
    LTE(dest, lhs, rhs) {
        if (isZero(rhs)) {
            return [
                `lda ${lhs}`,
                ...jle([
                    'lda #0',
                ], [
                    'lda #1',
                ]),
                `sta ${dest}`,
            ];
        } else if (isZero(lhs)) {
            return [
                `lda ${rhs}`,
                ...jlt([
                    'lda #1',
                ], [
                    'lda #0',
                ]),
                `sta ${dest}`,
            ];
        } else {
            const labelSign = createLabel();
            const labelTrue = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhs}`,
                `xor ${rhs}`,
                `jeq ${labelTrue}`,
                `jlt ${labelSign}`,

                `lda ${lhs}`,
                `sub ${rhs}`,
                `jlt ${labelTrue}`,
                'lda #0',
                `jmp ${labelEnd}`,

                `${labelSign}:`,
                `lda ${lhs}`,
                `jlt ${labelTrue}`,
                'lda #0',
                `jmp ${labelEnd}`,

                `${labelTrue}:`,
                'lda #1',

                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        }
    },
    EQ(dest, lhs, rhs) {
        return [
            `lda ${rhs}`,
            `sub ${lhs}`,
            ...jeq([
                'lda #255',
            ]),
            'add #1',
            `sta ${dest}`,
        ];
    },
    NEQ(dest, lhs, rhs) {
        return [
            `lda ${rhs}`,
            `sub ${lhs}`,
            ...jeq([
                'lda #1',
            ]),
            `sta ${dest}`,
        ];
    },
    GTE(dest, lhs, rhs) {
        return operations.LTE(dest, rhs, lhs);
    },
    GT(dest, lhs, rhs) {
        return operations.LT(dest, rhs, lhs);
    },
    GET(dest, array, index) {
        const address = createLabel();
        return [
            `lda ${index}`,
            `sta ${address}+1`,
            `${address}:`,
            `lda ${array}`,
            `sta ${dest}`,
        ];
    },
    PUT(array, index, src) {
        const address = createLabel();
        return [
            `lda ${index}`,
            `sta ${address}+1`,
            `lda ${src}`,
            `${address}:`,
            `sta ${array}`,
        ];
    },
};

export default operations;
