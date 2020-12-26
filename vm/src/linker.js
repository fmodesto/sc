import memory from './memory.js';
import generate from './codegen.js';
import loadDep from './library.js';

const deps = ['MUL', 'MOD', 'DIV'];

const addRequirements = function (instructions) {
    return instructions.map(([opcode, ...params]) => {
        if (deps.includes(opcode)) {
            let type = params.some((e) => e.includes(':')) ? 16 : 8;
            let dep = `${opcode.toLowerCase()}${type}`;
            return [
                [opcode, ...params],
                ['.DEP', dep],
            ];
        } else {
            return [[opcode, ...params]];
        }
    }).flat();
};

const linker = function (program, options = {}) {
    program = addRequirements(program);
    let requires = program.filter(([opcode]) => opcode === '.DEP' || opcode === '.EXTERN').map(([_, dep]) => dep);
    requires = requires.filter((e, i) => requires.indexOf(e) === i);
    program = [
        ...requires.map((e) => loadDep(e)).flat(),
        ...program,
    ];
    let { memory: mem, registers } = memory(program);
    let instructions = [
        ...registers,
        '.org $000',
        `jsr ${options.m}`,
        '_end_program_:',
        'jmp _end_program_',
        ...mem,
        ...generate(program, options.d),
    ];
    return instructions;
};

export default linker;
