let labelPrefix = '';
let labelIndex = 0;
const createLabel = () => `${labelPrefix}_asm_${labelIndex++}`;
const isLiteral = (val) => val.startsWith('#');
const isZero = (val) => val === '#0';
const literalValue = (val) => +val.substring(1);

const operations = {
    CALL([dest]) {
        return [
            `jsr ${dest}`,
        ];
    },
    JMP([dest]) {
        return [
            `jmp ${dest}`,
        ];
    },
    JZ([dest, src]) {
        return [
            `lda ${src}`,
            `jeq ${dest}`,
        ];
    },
    JNZ([dest, src]) {
        return [
            `lda ${src}`,
            `jne ${dest}`,
        ];
    },
    NEG([dest, src]) {
        return [
            'lda #0',
            `sub ${src}`,
            `sta ${dest}`,
        ];
    },
    INV([dest, src]) {
        return [
            `lda ${src}`,
            'xor #255',
            `sta ${dest}`,
        ];
    },
    NOT([dest, src]) {
        const label = createLabel();
        return [
            `lda ${src}`,
            `jeq ${label}`,
            'lda #255',
            `${label}:`,
            'add #1',
            `sta ${dest}`,
        ];
    },
    MOV([dest, src]) {
        return [
            `lda ${src}`,
            `sta ${dest}`,
        ];
    },
    ADD([dest, lhs, rhs]) {
        return [
            `lda ${rhs}`,
            `add ${lhs}`,
            `sta ${dest}`,
        ];
    },
    SUB([dest, lhs, rhs]) {
        return [
            `lda ${lhs}`,
            `sub ${rhs}`,
            `sta ${dest}`,
        ];
    },
    MUL([dest, lhs, rhs]) {
        return [
            `lda ${rhs}`,
            'sta mul8_b',
            `lda ${lhs}`,
            'sta mul8_a',
            'jsr mul8',
            `sta ${dest}`,
        ];
    },
    DIV([dest, lhs, rhs]) {
        return [
            `lda ${rhs}`,
            'sta div8_b',
            `lda ${lhs}`,
            'sta div8_a',
            'jsr div8',
            `sta ${dest}`,
        ];
    },
    MOD([dest, lhs, rhs]) {
        return [
            `lda ${rhs}`,
            'sta mod8_b',
            `lda ${lhs}`,
            'sta mod8_a',
            'jsr mod8',
            `sta ${dest}`,
        ];
    },
    SHL([dest, lhs, rhs]) {
        if (isLiteral(rhs)) {
            let v = literalValue(rhs) & 0x07;
            let shifts = Array(v).fill('shl');
            return [
                `lda ${lhs}`,
                ...shifts,
                `sta ${dest}`,
            ];
        } else {
            return [
                `lda ${rhs}`,
                'sta shl8_b',
                `lda ${lhs}`,
                'sta shl8_a',
                'jsr shl8',
                `sta ${dest}`,
            ];
        }
    },
    SHR([dest, lhs, rhs]) {
        if (isLiteral(rhs)) {
            let v = literalValue(rhs) & 0x07;
            let shifts = Array(v).fill('shr');
            return [
                `lda ${lhs}`,
                ...shifts,
                `sta ${dest}`,
            ];
        } else {
            return [
                `lda ${rhs}`,
                'sta shr8_b',
                `lda ${lhs}`,
                'sta shr8_a',
                'jsr shr8',
                `sta ${dest}`,
            ];
        }
    },
    AND([dest, lhs, rhs]) {
        return [
            `lda ${rhs}`,
            `and ${lhs}`,
            `sta ${dest}`,
        ];
    },
    OR([dest, lhs, rhs]) {
        return [
            `lda ${rhs}`,
            `ora ${lhs}`,
            `sta ${dest}`,
        ];
    },
    XOR([dest, lhs, rhs]) {
        return [
            `lda ${rhs}`,
            `xor ${lhs}`,
            `sta ${dest}`,
        ];
    },
    LT([dest, lhs, rhs]) {
        if (isZero(rhs)) {
            const labelTrue = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhs}`,
                `jlt ${labelTrue}`,
                'lda #0',
                `jmp ${labelEnd}`,
                `${labelTrue}:`,
                'lda #1',
                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        } else if (isZero(lhs)) {
            return operations.GTE([dest, rhs, lhs]);
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
    LTE([dest, lhs, rhs]) {
        if (isZero(rhs)) {
            const labelTrue = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhs}`,
                `jlt ${labelTrue}`,
                `jeq ${labelTrue}`,
                'lda #0',
                `jmp ${labelEnd}`,
                `${labelTrue}:`,
                'lda #1',
                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        } else if (isZero(lhs)) {
            return operations.GT([dest, rhs, lhs]);
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
    EQ([dest, lhs, rhs]) {
        const label = createLabel();
        return [
            `lda ${rhs}`,
            `sub ${lhs}`,
            `jeq ${label}`,
            'lda #255',
            `${label}:`,
            'add #1',
            `sta ${dest}`,
        ];
    },
    NEQ([dest, lhs, rhs]) {
        const label = createLabel();
        return [
            `lda ${rhs}`,
            `sub ${lhs}`,
            `jeq ${label}`,
            'lda #1',
            `${label}:`,
            `sta ${dest}`,
        ];
    },
    GTE([dest, lhs, rhs]) {
        if (isZero(rhs)) {
            const labelFalse = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhs}`,
                `jlt ${labelFalse}`,
                'lda #1',
                `jmp ${labelEnd}`,
                `${labelFalse}:`,
                'lda #0',
                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        } else if (isZero(lhs)) {
            return operations.LT([dest, rhs, lhs]);
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
                `jge ${labelTrue}`,
                'lda #0',
                `jmp ${labelEnd}`,

                `${labelSign}:`,
                `lda ${lhs}`,
                `jge ${labelTrue}`,
                'lda #0',
                `jmp ${labelEnd}`,

                `${labelTrue}:`,
                'lda #1',

                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        }
    },
    GT([dest, lhs, rhs]) {
        if (isZero(rhs)) {
            const labelFalse = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhs}`,
                `jlt ${labelFalse}`,
                `jeq ${labelFalse}`,
                'lda #1',
                `jmp ${labelEnd}`,
                `${labelFalse}:`,
                'lda #0',
                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        } else if (isZero(lhs)) {
            return operations.LTE([dest, rhs, lhs]);
        } else {
            const labelSign = createLabel();
            const labelFalse = createLabel();
            const labelEnd = createLabel();
            return [
                `lda ${lhs}`,
                `xor ${rhs}`,
                `jeq ${labelFalse}`,
                `jlt ${labelSign}`,

                `lda ${lhs}`,
                `sub ${rhs}`,
                `jlt ${labelFalse}`,
                'lda #1',
                `jmp ${labelEnd}`,

                `${labelSign}:`,
                `lda ${lhs}`,
                `jlt ${labelFalse}`,
                'lda #1',
                `jmp ${labelEnd}`,

                `${labelFalse}:`,
                'lda #0',

                `${labelEnd}:`,
                `sta ${dest}`,
            ];
        }
    },
    '.FUNCTION'([method]) {
        labelPrefix = method;
        return [
            `${method}:`,
        ];
    },
    '.RETURN'([method]) {
        return [
            `ret ${method}`,
        ];
    },
    '.LABEL'([label]) {
        return [
            `${label}:`,
        ];
    },
    '.BYTE'() {
        return [];
    },
    '.CODE'() {
        return [];
    },
    '.LOCALS'() {
        return [];
    },
    '.TMP'() {
        return [];
    },
};

const generate = function (instructions, format = false) {
    labelIndex = 0;
    let ins = (op, params) => `${op} ${params.join(',')}`;
    let formatInstruction = (first, op, params) => (format ? `${(first || '').padEnd(30)}; ${ins(op, params)}` : first);
    return instructions.map(([op, ...params]) => {
        let [op1, ...ops] = operations[op](params);
        return [
            formatInstruction(op1, op, params),
            ...ops,
        ];
    }).flat().filter((e) => e);
};

export default generate;
