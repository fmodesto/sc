let labelPrefix = '';
let labelIndex = 0;

const configureLabel = function (prefix, index) {
    labelPrefix = prefix;
    labelIndex = index;
};

const createLabel = function () {
    return `${labelPrefix}_asm_${labelIndex++}`;
};

const cond = function (opcode, alt, cons) {
    if (typeof cons === 'undefined') {
        let label = createLabel();
        return [
            `${opcode} ${label}`,
            ...alt,
            `${label}:`,
        ];
    } else {
        let elseLabel = createLabel();
        let endLabel = createLabel();
        return [
            `${opcode} ${elseLabel}`,
            ...alt,
            `jmp ${endLabel}`,
            `${elseLabel}:`,
            ...cons,
            `${endLabel}:`,
        ];
    }
};

const jle = function (alt, cons) {
    if (typeof cons === 'undefined') {
        let label = createLabel();
        return [
            `jlt ${label}`,
            `jeq ${label}`,
            ...alt,
            `${label}:`,
        ];
    } else {
        let elseLabel = createLabel();
        let endLabel = createLabel();
        return [
            `jlt ${elseLabel}`,
            `jeq ${elseLabel}`,
            ...alt,
            `jmp ${endLabel}`,
            `${elseLabel}:`,
            ...cons,
            `${endLabel}:`,
        ];
    }
};

const jgt = function (alt, cons) {
    if (typeof cons === 'undefined') {
        let ifLabel = createLabel();
        let endLabel = createLabel();
        return [
            `jeq ${ifLabel}`,
            `jge ${endLabel}`,
            `${ifLabel}:`,
            ...alt,
            `${endLabel}:`,
        ];
    } else {
        let ifLabel = createLabel();
        let elseLabel = createLabel();
        let endLabel = createLabel();
        return [
            `jeq ${ifLabel}`,
            `jge ${elseLabel}`,
            `${ifLabel}:`,
            ...alt,
            `jmp ${endLabel}`,
            `${elseLabel}:`,
            ...cons,
            `${endLabel}:`,
        ];
    }
};

const jcs = (alt, cons) => cond('jcs', alt, cons);
const jnc = (alt, cons) => cond('jnc', alt, cons);
const jeq = (alt, cons) => cond('jeq', alt, cons);
const jne = (alt, cons) => cond('jne', alt, cons);
const jlt = (alt, cons) => cond('jlt', alt, cons);
const jge = (alt, cons) => cond('jge', alt, cons);

export {
    configureLabel,
    createLabel,
    jcs,
    jnc,
    jeq,
    jne,
    jlt,
    jle,
    jge,
    jgt,
};
