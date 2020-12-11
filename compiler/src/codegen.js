import {
    AST,
    Program,
    GlobalDeclaration,
    MethodDeclaration,
    Var,
    AssignmentStatement,
    IfStatement,
    WhileStatement,
    CallStatement,
    ReturnStatement,
    TernaryOperation,
    BinaryOperation,
    UnaryOperation,
    MethodCall,
    Literal,
    Variable,
} from './ast.js';
import createContext from './context.js';
import createRegister from './register.js';
import './optimizer.js';

const moveInstruction = function (dest, src) {
    if (dest === src) {
        return [];
    }
    return [`MOV ${dest},${src}`];
};
const boolInstruction = function (dest, { address, type }) {
    if (type === 'bool') {
        return moveInstruction(dest, address);
    } else {
        return [`BOOL ${dest},${address}`];
    }
};
const castInstruction = function (dest, destType, src, srcType) {
    if (destType === srcType) {
        return moveInstruction(dest, src);
    } else if (destType === 'int' && srcType === 'char') {
        return [`CAST ${dest},${src}`];
    } else if (destType === 'bool') {
        return [`BOOL ${dest},${src}`];
    } else {
        throw new Error(`'Not implemented cast from '${srcType}' to '${destType}'`);
    }
};
const address = function (prefix, name, type) {
    if (prefix.length) {
        prefix += '_';
    }
    if (type === 'int') {
        return `${prefix}${name}_H:${prefix}${name}_L`;
    } else {
        return `${prefix}${name}`;
    }
};
const variable = function (context, name) {
    if (typeof context.getVarType(name) === 'undefined') {
        throw new Error(`Variable should be defined ${name}`);
    }
    let prefix = context.isLocal(name) ? `${context.getCurrentMethod()}` : '';
    return address(prefix, name, context.getVarType(name));
};
const hex = function (value) {
    return `$${(value & 0xFF).toString(16).toUpperCase().padStart(2, '0')}`;
};

AST.generate = function () {
    throw new Error('Not implemented');
};

Program.generate = function (context = createContext()) {
    this.globals.forEach((e) => context.addVar(e.name, e.type));
    this.methods.forEach((e) => context.addMethod(e.name, e.type, e.parameters.map((p) => ({ name: p.name, type: p.type }))));
    return [
        ...this.globals.map((e) => e.generate(context)).flat(),
        ...this.methods.map((e) => e.generate(context.createContext(e.name))).flat(),
    ];
};

GlobalDeclaration.generate = function () {
    let value = this.expression.optimize().value;
    if (this.type === 'bool') {
        return [`.BYTE ${this.name} ${hex(value ? 1 : 0)}`];
    } else if (this.type === 'char') {
        return [`.BYTE ${this.name} ${hex(value)}`];
    } else if (this.type === 'int') {
        return [
            `.BYTE ${this.name}_H ${hex(value >> 8)}`,
            `.BYTE ${this.name}_L ${hex(value)}`,
        ];
    } else {
        throw new Error(`Unknown type ${this.type}`);
    }
};

const returnAddress = function (name, type) {
    if (type === 'void') {
        return [];
    } else if (type === 'bool' || type === 'char') {
        return [`.BYTE ${name}_return 0`];
    } else if (type === 'int') {
        return [
            `.BYTE ${name}_return_H 0`,
            `.BYTE ${name}_return_L 0`,
        ];
    } else {
        throw new Error(`Unknown type ${type}`);
    }
};

MethodDeclaration.generate = function (context) {
    context.addVar('return', this.type);
    this.parameters.forEach((e) => context.addVar(e.name, e.type));
    this.vars.forEach((e) => context.addVar(e.name, e.type));

    let params = this.parameters.map((e) => e.generate(context)).flat();
    let vars = this.vars.map((e) => e.generate(context)).flat();
    let ret = returnAddress(this.name, this.type);

    let register = createRegister(context.getCurrentMethod());
    let instructions = this.statements.map((e) => e.generate(context, register)).flat();
    let tmps = register.getGenerated().map((e) => `.BYTE ${e} 0`);

    const prefix = (label, array) => (array.length ? [label, ...array] : []);
    return [
        `.FUNCTION ${this.name}`,
        ...ret,
        ...params,
        ...prefix('.LOCALS', vars),
        ...prefix('.TMP', tmps),
        '.CODE',
        ...instructions,
        `.LABEL ${this.name}_end`,
        `.RETURN ${this.name}`,
    ];
};

Var.generate = function (context) {
    if (context.getVarType(this.name) === 'int') {
        return [
            `.BYTE ${context.getCurrentMethod()}_${this.name}_H 0`,
            `.BYTE ${context.getCurrentMethod()}_${this.name}_L 0`,
        ];
    } else {
        return [
            `.BYTE ${context.getCurrentMethod()}_${this.name} 0`,
        ];
    }
};

AssignmentStatement.generate = function (context, register) {
    let { address, type, instructions } = this.expression.generate(context, register);
    register.release(address);
    return [
        ...instructions,
        ...castInstruction(variable(context, this.name), context.getVarType(this.name), address, type),
    ];
};

IfStatement.generate = function (context, register) {
    let elseLabel = register.generateLabel();
    let endLabel = register.generateLabel();
    let { address, instructions: pred } = this.predicate.generate(context, register);
    register.release(address);
    let cons = this.consequent.map((e) => e.generate(context, register)).flat();
    let alt = this.alternate.map((e) => e.generate(context, register)).flat();
    if (alt.length === 0) {
        return [
            ...pred,
            `JZ ${endLabel},${address}`,
            ...cons,
            `.LABEL ${endLabel}`,
        ];
    } else {
        return [
            ...pred,
            `JZ ${elseLabel},${address}`,
            ...cons,
            `JMP ${endLabel}`,
            `.LABEL ${elseLabel}`,
            ...alt,
            `.LABEL ${endLabel}`,
        ];
    }
};

WhileStatement.generate = function (context, register) {
    let whileLabel = register.generateLabel();
    let endLabel = register.generateLabel();
    let { address, instructions: pred } = this.predicate.generate(context, register);
    register.release(address);
    let block = this.block.map((e) => e.generate(context, register)).flat();
    return [
        `.LABEL ${whileLabel}`,
        ...pred,
        `JZ ${endLabel},${address}`,
        ...block,
        `JMP ${whileLabel}`,
        `.LABEL ${endLabel}`,
    ];
};

CallStatement.generate = function (context, register) {
    let { address, instructions } = this.expression.generate(context, register);
    register.release(address);
    return [
        ...instructions.slice(0, -1),
    ];
};

ReturnStatement.generate = function (context, register) {
    if (this.expression.length === 0) {
        return [
            `JMP ${context.getCurrentMethod()}_end`,
        ];
    } else {
        let { address, type, instructions } = this.expression[0].generate(context, register);
        register.release(address);
        let returnType = context.getMethodType();
        return [
            ...instructions,
            ...castInstruction(variable(context, 'return'), returnType, address, type),
            `JMP ${context.getCurrentMethod()}_end`,
        ];
    }
};

const createUnary = function (op, type, register, exp) {
    register.release(exp.address);
    let dest = register.fetch(type);
    return {
        address: dest,
        type,
        instructions: [
            ...exp.instructions,
            `${op} ${dest},${exp.address}`,
        ],
    };
};

const unary = {
    '-'(register, src) {
        return createUnary('NEG', src.type, register, src);
    },
    '~'(register, src) {
        return createUnary('INV', src.type, register, src);
    },
    '!'(register, src) {
        return createUnary('NOT', 'bool', register, src);
    },
    'bool'(register, src) {
        if (src.type === 'bool') {
            return src;
        } else {
            return createUnary('BOOL', 'bool', register, src);
        }
    },
    'char'(register, src) {
        if (src.type === 'char') {
            return src;
        } else if (src.type === 'bool') {
            return {
                ...src,
                type: 'char',
            };
        } else {
            return createUnary('MOV', 'char', register, src);
        }
    },
    'int'(register, src) {
        if (src.type === 'int') {
            return src;
        } else {
            return createUnary('CAST', 'int', register, src);
        }
    },
};

const createBinary = function (op, type, register, lhs, rhs) {
    register.release(lhs.address);
    register.release(rhs.address);
    let address = register.fetch(type);
    return {
        address,
        type,
        instructions: [
            ...lhs.instructions,
            ...rhs.instructions,
            `${op} ${address},${lhs.address},${rhs.address}`,
        ],
    };
};

const createCastBinary = function (op, register, lhs, rhs) {
    let type = combineTypes(lhs, rhs);
    if (lhs.type !== rhs.type) {
        lhs = unary.int(register, lhs);
        rhs = unary.int(register, rhs);
    }
    register.release(lhs.address);
    register.release(rhs.address);
    let address = register.fetch(type);
    return {
        address,
        type,
        instructions: [
            ...lhs.instructions,
            ...rhs.instructions,
            `${op} ${address},${lhs.address},${rhs.address}`,
        ],
    };
};

const combineTypes = function ({type : lhs}, {type : rhs}) {
    if (lhs === rhs) {
        return lhs;
    } else if (lhs === 'int' && rhs === 'char' || lhs === 'char' && rhs === 'int') {
        return 'int';
    } else {
        throw new Error('Invalid types');
    }
};

const binary = {
    '+'(register, lhs, rhs) {
        return createCastBinary('ADD', register, lhs, rhs);
    },
    '-'(register, lhs, rhs) {
        return createCastBinary('SUB', register, lhs, rhs);
    },
    '*'(register, lhs, rhs) {
        return createCastBinary('MUL', register, lhs, rhs);
    },
    '/'(register, lhs, rhs) {
        return createCastBinary('DIV', register, lhs, rhs);
    },
    '%'(register, lhs, rhs) {
        return createCastBinary('MOD', register, lhs, rhs);
    },
    '<<'(register, lhs, rhs) {
        return createBinary('SHL', lhs.type, register, lhs, rhs);
    },
    '>>'(register, lhs, rhs) {
        return createBinary('SHR', lhs.type, register, lhs, rhs);
    },
    '&'(register, lhs, rhs) {
        return createCastBinary('AND', register, lhs, rhs);
    },
    '|'(register, lhs, rhs) {
        return createCastBinary('OR', register, lhs, rhs);
    },
    '^'(register, lhs, rhs) {
        return createCastBinary('XOR', register, lhs, rhs);
    },
    '<'(register, lhs, rhs) {
        return createBinary('LT', 'bool', register, lhs, rhs);
    },
    '<='(register, lhs, rhs) {
        return createBinary('LTE', 'bool', register, lhs, rhs);
    },
    '=='(register, lhs, rhs) {
        return createBinary('EQ', 'bool', register, lhs, rhs);
    },
    '!='(register, lhs, rhs) {
        return createBinary('NEQ', 'bool', register, lhs, rhs);
    },
    '>='(register, lhs, rhs) {
        return createBinary('GTE', 'bool', register, lhs, rhs);
    },
    '>'(register, lhs, rhs) {
        return createBinary('GT', 'bool', register, lhs, rhs);
    },
};

TernaryOperation.generate = function (context, register) {
    let elseLabel = register.generateLabel();
    let endLabel = register.generateLabel();
    let { address: tmp0, instructions: pred } = this.predicate.generate(context, register);
    register.release(tmp0);
    let cons = this.consequent.generate(context, register);
    register.release(cons.address);
    let alt = this.alternate.generate(context, register);
    register.release(alt.address);
    let type = combineTypes(cons, alt);
    let dest = register.fetch(type);
    return {
        address: dest,
        type,
        instructions: [
            ...pred,
            `JZ ${elseLabel},${tmp0}`,
            ...cons.instructions,
            ...castInstruction(dest, type, cons.address, cons.type),
            `JMP ${endLabel}`,
            `.LABEL ${elseLabel}`,
            ...alt.instructions,
            ...castInstruction(dest, type, alt.address, alt.type),
            `.LABEL ${endLabel}`,
        ],
    };
};

BinaryOperation.generate = function (context, register) {
    if (this.operation === '&&') {
        let endLabel = register.generateLabel();
        let lhs = this.lhs.generate(context, register);
        register.release(lhs.address);
        let rhs = this.rhs.generate(context, register);
        register.release(rhs.address);
        let dest = register.fetch('bool');
        return {
            address: dest,
            type: 'bool',
            instructions: [
                ...lhs.instructions,
                ...boolInstruction(dest, lhs),
                `JZ ${endLabel},${dest}`,
                ...rhs.instructions,
                ...boolInstruction(dest, rhs),
                `.LABEL ${endLabel}`,
            ],
        };
    } else if (this.operation === '||') {
        let endLabel = register.generateLabel();
        let lhs = this.lhs.generate(context, register);
        register.release(lhs.address);
        let rhs = this.rhs.generate(context, register);
        register.release(rhs.address);
        let dest = register.fetch('bool');
        return {
            address: dest,
            type: 'bool',
            instructions: [
                ...lhs.instructions,
                ...boolInstruction(dest, lhs),
                `JNZ ${endLabel},${dest}`,
                ...rhs.instructions,
                ...boolInstruction(dest, rhs),
                `.LABEL ${endLabel}`,
            ],
        };
    } else {
        let lhs = this.lhs.generate(context, register);
        let rhs = this.rhs.generate(context, register);
        return binary[this.operation](register, lhs, rhs);
    }
};

UnaryOperation.generate = function (context, register) {
    let exp = this.expression.generate(context, register);
    return unary[this.operation](register, exp);
};

MethodCall.generate = function (context, register) {
    let params = this.parameters.map((e) => e.generate(context, register));
    let methodParams = context.getMethodParameters(this.name);
    let setParams = methodParams.map((e, i) => castInstruction(address(this.name, e.name, e.type), e.type, params[i].address, params[i].type)).flat();
    params.forEach(({ address }) => register.release(address));
    let type = context.getMethodType(this.name);
    let dest = type === 'void' ? '_ugly_hack_' : register.fetch(type);
    return {
        address: dest,
        type,
        instructions: [
            ...params.map((e) => e.instructions).flat(),
            ...setParams,
            `CALL ${this.name}`,
            `MOV ${dest},${address(this.name, 'return', type)}`,
        ],
    };
};

Literal.generate = function () {
    let value = this.type === 'int' ?  `#${hex(this.value >> 8)}:#${hex(this.value)}` : `#${hex(this.value)}`;
    return {
        address: value,
        type: this.type,
        instructions: [],
    };
};

Variable.generate = function (context) {
    return {
        address: variable(context, this.name),
        type: context.getVarType(this.name),
        instructions: [],
    };
};
