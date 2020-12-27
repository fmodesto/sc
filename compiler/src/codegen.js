import {
    AST,
    Program,
    GlobalDeclaration,
    MethodDeclaration,
    Var,
    AssignmentStatement,
    IfStatement,
    ForStatement,
    DoStatement,
    WhileStatement,
    CallStatement,
    ReturnStatement,
    TernaryOperation,
    BinaryOperation,
    UnaryOperation,
    MethodCall,
    Literal,
    Variable,
    ArrayStatement,
    ArrayAccess,
    ArrayDeclaration,
    ArrayContents,
} from './ast.js';
import createContext from './context.js';
import createRegister from './register.js';
import './optimizer.js';
import { logTwo, nearPower } from './binary.js';

const isLiteral = function (address) {
    return address.split(':').every((e) => e.startsWith('#'));
};
const literalValue = function (address) {
    const val = (e) => (e.startsWith('#$') ? +`0x${e.substring(2)}` & 0xFF : +e.substring(1) & 0xFF);
    let parts = address.split(':');
    if (parts.length === 2) {
        let v = val(parts[0]) << 8 | val(parts[1]);
        return v >= (1 << 15) ? v - (1 << 16) : v;
    } else {
        let v = val(parts[0]);
        return v >= (1 << 7) ? v - (1 << 8) : v;
    }
};
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
const castLiteral = function (type, src) {
    let value = literalValue(src);
    if (type === 'bool') {
        return `#${hex(value ? 1 : 0)}`;
    } else if (type === 'char') {
        return `#${hex(value)}`;
    } else if (type === 'int') {
        return `#${hex(value >> 8)}:#${hex(value)}`;
    } else {
        throw new Error(`'Not implemented cast to '${type}'`);
    }
};
const castInstruction = function (dest, destType, src, srcType) {
    if (destType === srcType) {
        return moveInstruction(dest, src);
    } else if (isLiteral(src)) {
        return moveInstruction(dest, castLiteral(destType, src));
    } else if (destType === 'int' && srcType === 'char') {
        return [`CAST ${dest},${src}`];
    } else if (destType === 'bool') {
        return [`BOOL ${dest},${src}`];
    } else {
        throw new Error(`'Not implemented cast from '${srcType}' to '${destType}'`);
    }
};
const castExpression = function (type, expression) {
    return UnaryOperation.create({ operation: type, expression });
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
const warning = function (src, message) {
    if (typeof process.env.JEST_WORKER_ID === 'undefined') {
        console.error(`${message}\n${src}`);
    }
};

const codeArrayIndex = function (context, register, { name, access }) {
    // Example:
    // char[5][16]
    // shifts = [3,4,0] -> [4,0]
    // address = ((idx(0) << 4) + idx(1)) << 0)
    const char = (value) => Literal.create({ type: 'char', value });
    const add = (lhs, rhs) => BinaryOperation.create({ operation: '+', lhs, rhs });
    const shl = (lhs, rhs) => BinaryOperation.create({ operation: '<<', lhs, rhs });
    const shr = (lhs, rhs) => BinaryOperation.create({ operation: '>>', lhs, rhs });
    const cast = (expression) => castExpression('char', expression);
    let type = context.getArrayType(name);
    let shifts = context.getArrayDimensions(name).reduceRight((a, e) => [logTwo(e), ...a], [type === 'int' ? 1 : 0]).slice(1);
    let boolMask = '#$00';
    if (type === 'bool') {
        if (shifts.length > 1) {
            shifts[shifts.length - 2] = Math.max(shifts[shifts.length - 2] - 3, 0);
        }
        let lastExp = cast(access[access.length - 1]).optimize();
        if (Literal.isPrototypeOf(lastExp)) {
            boolMask = `#${hex(1 << (lastExp.value & 0x07))}`;
            access[access.length - 1] = shr(lastExp, char(3));
        } else {
            access[access.length - 1] = {
                optimize() { return this; },
                generate(context, register) {
                    let code = lastExp.generate(context, register);
                    boolMask = register.fetch('char');
                    register.release(code.address);
                    let address = register.fetch('char');
                    return {
                        type: 'char',
                        address,
                        instructions: [
                            ...code.instructions,
                            `SHL ${boolMask},#$01,${code.address}`,
                            `SHR ${address},${code.address},#$03`,
                        ],
                    };
                },
            };
        }
    }
    let address = access.reduce((a, e, i) => shl(add(a, cast(e)), char(shifts[i])), char(0)).optimize();
    let code = address.generate(context, register);
    return {
        ...code,
        boolMask,
    };
};

AST.generate = function () {
    throw new Error(`Not implemented: ${this.kind}.generate()`);
};

Program.generate = function (context = createContext()) {
    this.globals.forEach((e) => e.addToContext(context));
    this.methods.forEach((e) => e.addToContext(context));
    return [
        ...this.globals.map((e) => e.generate(context)).flat(),
        ...this.methods.map((e) => e.generate(context.createContext(e.name))).flat(),
    ];
};

GlobalDeclaration.addToContext = function (context) {
    context.addVar(this.name, this.type);
};

GlobalDeclaration.generate = function () {
    let value = this.expression.optimize().value;
    const mem = (inc = 0) => (this.address.length === 0 ? '.BYTE' : `.RBYTE $${(this.address[0] + inc).toString(16).toUpperCase().padStart(3, '0')}`);
    if (this.type === 'bool') {
        return [`${mem(0)} ${this.name} ${hex(value ? 1 : 0)}`];
    } else if (this.type === 'char') {
        return [`${mem(0)} ${this.name} ${hex(value)}`];
    } else if (this.type === 'int') {
        return [
            `${mem(0)} ${this.name}_H ${hex(value >> 8)}`,
            `${mem(1)} ${this.name}_L ${hex(value)}`,
        ];
    } else {
        throw new Error(`Unknown type ${this.type}`);
    }
};

ArrayDeclaration.addToContext = function (context) {
    let dimensions = this.dimensions.map((e, i) => (i === 0 ? e : nearPower(e)));
    context.addArray(this.name, this.type, dimensions);
};

ArrayDeclaration.generate = function (context) {
    let dimensions = context.getArrayDimensions(this.name);
    let values = this.value.generateValues(this.type, dimensions).replace(/( #)*$/, '');
    return [
        `.ARRAY ${this.name} ${values}`,
    ];
};

ArrayContents.generateValues = function (type, dimensions) {
    const chunkArray = (array, size) => (array.length <= size ? [ array ] : [array.slice(0,size), ...chunkArray(array.slice(size), size)]);
    const toHex = (array) => (array.every((e) => e === -1) ? '#' : hex(array.map((e) => (e === -1 ? 0 : e)).reduceRight((a, e) => (a << 1) | e, 0)));
    if (dimensions.length === 1) {
        if (type === 'int') {
            return [
                ...this.elements.map((e) => `${hex(e.value >> 8)} ${hex(e.value)}`),
                ...Array(dimensions[0] - this.elements.length).fill('# #'),
            ].join(' ');
        } else if (type === 'char') {
            return [
                ...this.elements.map((e) => `${hex(e.value)}`),
                ...Array(dimensions[0] - this.elements.length).fill('#'),
            ].join(' ');
        } else if (type === 'bool') {
            return chunkArray([
                ...this.elements.map((e) => (e.value ? 1 : 0)),
                ...Array(dimensions[0] - this.elements.length).fill(-1),
            ], 8).map((e) => toHex(e)).join(' ');
        } else {
            throw new Error(`Unknown type ${type}`);
        }
    } else {
        let values = this.elements.map((e) => e.generateValues(type, dimensions.slice(1)));
        let multiplier = type === 'int' ? 2 : 1;
        let missing = multiplier * (dimensions[0] - this.elements.length) * dimensions.slice(1).reduce((a, b) => a * b);
        return [
            ...values,
            ...Array(missing).fill('#'),
        ].join(' ');
    }
};

const returnAddress = function (name, type) {
    if (type === 'void') {
        return [];
    } else if (type === 'bool' || type === 'char') {
        return [`.BYTE ${name}_return $00`];
    } else if (type === 'int') {
        return [
            `.BYTE ${name}_return_H $00`,
            `.BYTE ${name}_return_L $00`,
        ];
    } else {
        throw new Error(`Unknown type ${type}`);
    }
};

MethodDeclaration.addToContext = function (context) {
    context.addMethod(this.name, this.type, this.parameters.map((p) => ({ name: p.name, type: p.type })));
};

MethodDeclaration.generate = function (context) {
    context.addVar('return', this.type);
    let ret = returnAddress(this.name, this.type);

    this.parameters.forEach((e) => context.addVar(e.name, e.type));
    let params = this.parameters.map((e) => e.generate(context)).flat();

    if (this.declaration) {
        this.vars.forEach((e) => context.addVar(e.name, e.type));
        let vars = this.vars.filter((e) => !e.static).map((e) => e.generate(context)).flat();
        let fixed = this.vars.filter((e) => e.static).map((e) => e.generate(context)).flat();

        let register = createRegister(context.getCurrentMethod());
        let instructions = this.statements.map((e) => e.generate(context, register)).flat();
        let tmps = register.getGenerated().map((e) => `.BYTE ${e} $00`);

        const prefix = (label, array) => (array.length ? [label, ...array] : []);
        if (register.getInUse().length) {
            throw new Error(`Memory leak detected ${register.getInUse()}`);
        }
        return [
            `.FUNCTION ${this.name}`,
            ...ret,
            ...params,
            ...prefix('.STATIC', fixed),
            ...prefix('.LOCALS', vars),
            ...prefix('.TMP', tmps),
            '.CODE',
            ...instructions,
            `.LABEL ${this.name}_end`,
            `.ENDFUNCTION ${this.name}`,
        ];
    } else {
        return [
            `.EXTERN ${this.name}`,
            ...ret,
            ...params,
            `.ENDEXTERN ${this.name}`,
        ];
    }
};

Var.generate = function (context) {
    let value = this.expression.optimize().value;
    if (context.getVarType(this.name) === 'int') {
        return [
            `.BYTE ${context.getCurrentMethod()}_${this.name}_H ${hex(value >> 8)}`,
            `.BYTE ${context.getCurrentMethod()}_${this.name}_L ${hex(value)}`,
        ];
    } else {
        return [
            `.BYTE ${context.getCurrentMethod()}_${this.name} ${hex(value)}`,
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

ArrayStatement.generate = function (context, register) {
    let index = codeArrayIndex(context, register, this);
    if (this.compound) {
        register.save(`index_${this.name}`, index.address);
        register.save(`indexMask_${this.name}`, index.boolMask);
    }

    let type = context.getArrayType(this.name);
    let castExp = type === 'bool' ? this.expression : castExpression(type, this.expression);
    let exp = castExp.generate(context, register);
    let expAddress = exp.address;
    let cast = [];
    if (type === 'bool') {
        expAddress = register.fetch('char');
        register.release(exp.address);
        register.release(index.boolMask);
        let setMask = [ `OR ${expAddress},${index.boolMask},${expAddress}` ];
        let clearMask = [];
        if (isLiteral(index.boolMask)) {
            clearMask = [
                `AND ${expAddress},#${hex(~literalValue(index.boolMask))},${expAddress}`,
            ];
        } else {
            let tmpAddress = register.fetch('char');
            register.release(tmpAddress);
            clearMask = [
                `INV ${tmpAddress},${index.boolMask}`,
                `AND ${expAddress},${expAddress},${tmpAddress}`,
            ];
        }
        if (isLiteral(exp.address)) {
            let mask = literalValue(exp.address) ? setMask : clearMask;
            cast = [
                `GET ${expAddress},${this.name},${index.address}`,
                ...mask,
            ];
        } else {
            let falseLabel = register.generateLabel();
            let endLabel = register.generateLabel();
            cast = [
                `GET ${expAddress},${this.name},${index.address}`,
                `JZ ${falseLabel},${exp.address}`,
                ...setMask,
                `JMP ${endLabel}`,
                `.LABEL ${falseLabel}`,
                ...clearMask,
                `.LABEL ${endLabel}`,
            ];
        }
    }

    register.release(expAddress);
    register.release(index.address);

    return [
        ...index.instructions,
        ...exp.instructions,
        ...cast,
        `PUT ${this.name},${index.address},${expAddress}`,
    ];
};

IfStatement.generate = function (context, register) {
    if (Literal.isPrototypeOf(this.predicate)) {
        warning(this.source, 'If statement with constant predicate');
        if (this.predicate.value) {
            return this.consequent.map((e) => e.generate(context, register)).flat();
        } else {
            return this.alternate.map((e) => e.generate(context, register)).flat();
        }
    }
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

ForStatement.generate = function (context, register) {
    let init = this.initialize.map((e) => e.generate(context, register)).flat();
    let iterate = this.iteration.map((e) => e.generate(context, register)).flat();
    let block = this.block.map((e) => e.generate(context, register)).flat();
    if (this.predicate.length === 0 || Literal.isPrototypeOf(this.predicate[0]) && this.predicate[0].value) {
        let loopLabel = register.generateLabel();
        return [
            ...init,
            `.LABEL ${loopLabel}`,
            ...block,
            ...iterate,
            `JMP ${loopLabel}`,
        ];
    } else if (Literal.isPrototypeOf(this.predicate[0])) {
        return [
            ...init,
            ...block,
            ...iterate,
        ];
    } else {
        let loopLabel = register.generateLabel();
        let endLabel = register.generateLabel();
        let { address, instructions } = this.predicate[0].generate(context, register);
        register.release(address);
        return [
            ...init,
            `.LABEL ${loopLabel}`,
            ...instructions,
            `JZ ${endLabel},${address}`,
            ...block,
            ...iterate,
            `JMP ${loopLabel}`,
            `.LABEL ${endLabel}`,
        ];
    }
};

DoStatement.generate = function (context, register) {
    let block = this.block.map((e) => e.generate(context, register)).flat();
    if (Literal.isPrototypeOf(this.predicate) && !this.predicate.value) {
        warning(this.source, 'Unnecessary do while statement');
        return block;
    }

    let loopLabel = register.generateLabel();
    if (Literal.isPrototypeOf(this.predicate)) {
        return [
            `.LABEL ${loopLabel}`,
            ...block,
            `JMP ${loopLabel}`,
        ];
    } else {
        let { address, instructions: pred } = this.predicate.generate(context, register);
        register.release(address);
        return [
            `.LABEL ${loopLabel}`,
            ...block,
            ...pred,
            `JNZ ${loopLabel},${address}`,
        ];
    }
};

WhileStatement.generate = function (context, register) {
    if (Literal.isPrototypeOf(this.predicate) && !this.predicate.value) {
        warning(this.source, 'Unexecutable while statement');
        return [];
    }

    let block = this.block.map((e) => e.generate(context, register)).flat();
    let loopLabel = register.generateLabel();
    let endLabel = register.generateLabel();
    if (Literal.isPrototypeOf(this.predicate)) {
        return [
            `.LABEL ${loopLabel}`,
            ...block,
            `JMP ${loopLabel}`,
        ];
    } else {
        let { address, instructions: pred } = this.predicate.generate(context, register);
        register.release(address);
        return [
            `.LABEL ${loopLabel}`,
            ...pred,
            `JZ ${endLabel},${address}`,
            ...block,
            `JMP ${loopLabel}`,
            `.LABEL ${endLabel}`,
        ];
    }
};

CallStatement.generate = function (context, register) {
    return this.expression.generate(context, register, true);
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

const assertEmpty = function (src) {
    if (src.instructions.length) {
        throw new Error(`Literal ${JSON.stringify(src)}`);
    }
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
        } else if (isLiteral(src.address)) {
            assertEmpty(src);
            return {
                ...src,
                address: castLiteral('bool', src.address),
                type: 'bool',
            };
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
        } else if (isLiteral(src.address)) {
            assertEmpty(src);
            return {
                ...src,
                address: castLiteral('char', src.address),
                type: 'char',
            };
        } else {
            return createUnary('MOV', 'char', register, src);
        }
    },
    'int'(register, src) {
        if (src.type === 'int') {
            return src;
        } else if (isLiteral(src.address)) {
            assertEmpty(src);
            return {
                ...src,
                address: castLiteral('int', src.address),
                type: 'int',
            };
        } else {
            return createUnary('CAST', 'int', register, src);
        }
    },
};

const createBinary = function (op, type, register, lhs, rhs, cast = true) {
    if (cast && lhs.type !== rhs.type) {
        if (lhs.type === 'bool' || rhs.type === 'bool') {
            throw new Error(`Unexpected cast ${lhs.type} ${rhs.type}`);
        }
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

const combineTypes = function ({ type: lhs }, { type: rhs }) {
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
        return createBinary('ADD', combineTypes(lhs, rhs), register, lhs, rhs);
    },
    '-'(register, lhs, rhs) {
        return createBinary('SUB', combineTypes(lhs, rhs), register, lhs, rhs);
    },
    '*'(register, lhs, rhs) {
        return createBinary('MUL', combineTypes(lhs, rhs), register, lhs, rhs);
    },
    '/'(register, lhs, rhs) {
        return createBinary('DIV', combineTypes(lhs, rhs), register, lhs, rhs);
    },
    '%'(register, lhs, rhs) {
        return createBinary('MOD', combineTypes(lhs, rhs), register, lhs, rhs);
    },
    '<<'(register, lhs, rhs) {
        return createBinary('SHL', lhs.type, register, lhs, rhs, false);
    },
    '>>'(register, lhs, rhs) {
        return createBinary('SHR', lhs.type, register, lhs, rhs, false);
    },
    '&'(register, lhs, rhs) {
        return createBinary('AND', combineTypes(lhs, rhs), register, lhs, rhs);
    },
    '|'(register, lhs, rhs) {
        return createBinary('OR', combineTypes(lhs, rhs), register, lhs, rhs);
    },
    '^'(register, lhs, rhs) {
        return createBinary('XOR', combineTypes(lhs, rhs), register, lhs, rhs);
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
    if (this.statement) {
        return [
            ...params.map((e) => e.instructions).flat(),
            ...setParams,
            `CALL ${this.name}`,
        ];

    } else {
        let dest = register.fetch(type);
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
    }
};

ArrayAccess.generate = function (context, register) {
    let type = context.getArrayType(this.name);
    let code = {};
    let address = '';
    if (this.compound) {
        code = {
            instructions: [],
            address: register.state(`index_${this.name}`),
            boolMask: register.state(`indexMask_${this.name}`),
        };
        address = register.fetch(type);
    } else {
        code = codeArrayIndex(context, register, this);
        register.release(code.address);
        address = register.fetch(type);
        register.release(code.boolMask);
    }

    if (type === 'bool') {
        return {
            address,
            type,
            instructions: [
                ...code.instructions,
                `GET ${address},${this.name},${code.address}`,
                `AND ${address},${code.boolMask},${address}`,
                `BOOL ${address},${address}`,
            ],
        };
    } else {
        return {
            address,
            type,
            instructions: [
                ...code.instructions,
                `GET ${address},${this.name},${code.address}`,
            ],
        };
    }
};

Literal.generate = function () {
    let value = this.type === 'int' ? `#${hex(this.value >> 8)}:#${hex(this.value)}` : `#${hex(this.value)}`;
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
