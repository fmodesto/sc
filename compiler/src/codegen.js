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
const variable = (context, name) => (context.isLocal(name) ? `${context.getCurrentMethod()}_${name}` : `${name}`);

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
        return [`.BYTE ${this.name} ${value ? 1 : 0}`];
    } else if (this.type === 'byte') {
        return [`.BYTE ${this.name} ${value}`];
    } else {
        throw new Error(`Unknown type ${this.type}`);
    }
};

const returnAddress = function (name, type) {
    if (type === 'void') {
        return [];
    } else if (type === 'bool' || type === 'byte') {
        return [`.BYTE ${name}_return 0`];
    } else {
        throw new Error(`Unknown type ${this.type}`);
    }
};

MethodDeclaration.generate = function (context) {
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
    return [
        `.BYTE ${variable(context, this.name)} 0`,
    ];
};

AssignmentStatement.generate = function (context, register) {
    let { address, instructions } = this.expression.generate(context, register);
    register.release(address);
    return [
        ...instructions,
        ...moveInstruction(variable(context, this.name), address),
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
        let { address, instructions } = this.expression[0].generate(context, register);
        register.release(address);
        return [
            ...instructions,
            `MOV ${context.getCurrentMethod()}_return,${address}`,
            `JMP ${context.getCurrentMethod()}_end`,
        ];
    }
};

const createUnary = function (op, dest, { address, instructions }) {
    return {
        address: dest,
        instructions: [
            ...instructions,
            `${op} ${dest},${address}`,
        ],
    };
};

const unary = {
    '-'(dest, src) {
        return createUnary('NEG', dest, src);
    },
    '~'(dest, src) {
        return createUnary('INV', dest, src);
    },
    '!'(dest, src) {
        return createUnary('NOT', dest, src);
    },
};

const createBinary = function (op, address, { address: leftAddress, instructions: leftInstructions }, { address: rightAddress, instructions: rightInstructions }) {
    return {
        address,
        instructions: [
            ...leftInstructions,
            ...rightInstructions,
            `${op} ${address},${leftAddress},${rightAddress}`,
        ],
    };
};

const binary = {
    '+'(dest, lhs, rhs) {
        return createBinary('ADD', dest, lhs, rhs);
    },
    '-'(dest, lhs, rhs) {
        return createBinary('SUB', dest, lhs, rhs);
    },
    '*'(dest, lhs, rhs) {
        return createBinary('MUL', dest, lhs, rhs);
    },
    '/'(dest, lhs, rhs) {
        return createBinary('DIV', dest, lhs, rhs);
    },
    '%'(dest, lhs, rhs) {
        return createBinary('MOD', dest, lhs, rhs);
    },
    '<<'(dest, lhs, rhs) {
        return createBinary('SHL', dest, lhs, rhs);
    },
    '>>'(dest, lhs, rhs) {
        return createBinary('SHR', dest, lhs, rhs);
    },
    '&'(dest, lhs, rhs) {
        return createBinary('AND', dest, lhs, rhs);
    },
    '|'(dest, lhs, rhs) {
        return createBinary('OR', dest, lhs, rhs);
    },
    '^'(dest, lhs, rhs) {
        return createBinary('XOR', dest, lhs, rhs);
    },
    '<'(dest, lhs, rhs) {
        return createBinary('LT', dest, lhs, rhs);
    },
    '<='(dest, lhs, rhs) {
        return createBinary('LTE', dest, lhs, rhs);
    },
    '=='(dest, lhs, rhs) {
        return createBinary('EQ', dest, lhs, rhs);
    },
    '!='(dest, lhs, rhs) {
        return createBinary('NEQ', dest, lhs, rhs);
    },
    '>='(dest, lhs, rhs) {
        return createBinary('GTE', dest, lhs, rhs);
    },
    '>'(dest, lhs, rhs) {
        return createBinary('GT', dest, lhs, rhs);
    },
};

TernaryOperation.generate = function (context, register) {
    let elseLabel = register.generateLabel();
    let endLabel = register.generateLabel();
    let { address: tmp1, instructions: pred } = this.predicate.generate(context, register);
    register.release(tmp1);
    let { address: tmp2, instructions: cons } = this.consequent.generate(context, register);
    register.release(tmp2);
    let { address: tmp3, instructions: alt } = this.alternate.generate(context, register);
    register.release(tmp3);
    let dest = register.fetch();
    return {
        address: dest,
        instructions: [
            ...pred,
            `JZ ${elseLabel},${tmp1}`,
            ...cons,
            ...moveInstruction(dest, tmp2),
            `JMP ${endLabel}`,
            `.LABEL ${elseLabel}`,
            ...alt,
            ...moveInstruction(dest, tmp3),
            `.LABEL ${endLabel}`,
        ],
    };
};

BinaryOperation.generate = function (context, register) {
    let lhs = this.lhs.generate(context, register);
    let rhs = this.rhs.generate(context, register);
    register.release(lhs.address);
    register.release(rhs.address);
    let dest = register.fetch();
    return binary[this.operation](dest, lhs, rhs);
};

UnaryOperation.generate = function (context, register) {
    let exp = this.expression.generate(context, register);
    register.release(exp.address);
    let dest = register.fetch();
    return unary[this.operation](dest, exp);
};

MethodCall.generate = function (context, register) {
    let params = this.parameters.map((e) => e.generate(context, register));
    let setParams = context.getMethodParameters(this.name).map(({ name }, i) => `MOV ${this.name}_${name},${params[i].address}`);
    params.forEach(({ address }) => register.release(address));
    let dest = register.fetch();
    return {
        address: dest,
        instructions: [
            ...params.map((e) => e.instructions).flat(),
            ...setParams,
            `CALL ${this.name}`,
            `MOV ${dest},${this.name}_return`,
        ],
    };
};

Literal.generate = function () {
    let value = `#${this.value}`;
    return {
        address: value,
        instructions: [],
    };
};

Variable.generate = function (context) {
    return {
        address: variable(context, this.name),
        instructions: [],
    };
};
