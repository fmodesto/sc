import { configureLabel } from './labels.js';
import operations8 from './code8.js';
import operations16 from './code16.js';

const methods = {
    '.FUNCTION'([method]) {
        configureLabel(method, 0);
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
    '.REGISTER'() {
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
    '.DEP'() {
        return [];
    },
};

const generateInstruction = function (opcode, params) {
    if (opcode.startsWith('.')) {
        return methods[opcode](params);
    } else if (params.some((e) => e.includes(':'))) {
        return operations16[opcode](...params.map((e) => e.split(':')));
    } else {
        return operations8[opcode](...params);
    }
};

const generate = function (instructions, format = false) {
    configureLabel('', 0);
    let ins = (op, params) => `${op} ${params.join(',')}`;
    let formatInstruction = (first, op, params) => (format ? `${(first || '').padEnd(30)}; ${ins(op, params)}` : first);
    return instructions.map(([op, ...params]) => {
        let [op1, ...ops] = generateInstruction(op, params);
        if (!op1) {
            return [];
        }
        return [
            formatInstruction(op1, op, params),
            ...ops,
        ];
    }).flat().filter((e) => e);
};

export default generate;
