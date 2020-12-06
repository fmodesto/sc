let labelIndex = 0;
const createLabel = () => `_label_${labelIndex++}`;
const isLiteral = (val) => val.startsWith('#');
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
            'sta _op2',
            `lda ${lhs}`,
            'sta _op1',
            'jsr mul8',
            `sta ${dest}`,
        ];
    },
    DIV([dest, lhs, rhs]) {
        return [
            `lda ${rhs}`,
            'sta _op2',
            `lda ${lhs}`,
            'sta _op1',
            'jsr div8',
            `sta ${dest}`,
        ];
    },
    MOD([dest, lhs, rhs]) {
        return [
            `lda ${rhs}`,
            'sta _op2',
            `lda ${lhs}`,
            'sta _op1',
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
                'sta _op2',
                `lda ${lhs}`,
                'sta _op1',
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
                'sta _op2',
                `lda ${lhs}`,
                'sta _op1',
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
    },
    LTE([dest, lhs, rhs]) {
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
    },
    GT([dest, lhs, rhs]) {
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
    },
    '.FUNCTION'([method]) {
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

const generate = function (instructions) {
    labelIndex = 0;
    let ins = (op, params) => `; ${op} ${params.join(',')}`;
    return instructions.map(([op, ...params]) => [ ins(op, params), ...operations[op](params)]).flat();
};

export default generate;
