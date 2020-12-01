import {
    // AST,
    Program,
    GlobalDeclaration,
    MethodDeclaration,
    // Var,
    // Statement,
    // AssignmentStatement,
    // IfStatement,
    // WhileStatement,
    // CallStatement,
    // ReturnStatement,
    Expression,
    // TernaryOperation,
    BinaryOperation,
    UnaryOperation,
    // MethodCall,
    Literal,
    Variable,
} from './ast.js';
import createContext from './context.js';
import createRegister from './register.js';

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

MethodDeclaration.generate = function (context) {
    let register = createRegister(context.getCurrentMethod());
    this.statements.map((e) => e.generate(context, register));
    return [];
};

// Var.analyze = function (context) {
//     if (context.containsVar(this.name)) {
//         throw CompileError.create(this.source, `Variable '${this.name}' already defined`);
//     }
//     context.addVar(this.name, this.type);
// };

// AssignmentStatement.analyze = function (context) {
//     if (!context.containsVar(this.name)) {
//         throw CompileError.create(this.source, `Variable ${this.name} not defined`);
//     }
//     const destType = context.getVarType(this.name);
//     let type = this.expression.analyze(context);
//     if (!compatibleType(destType, type)) {
//         throw CompileError.create(this.source, `Type missmatch. Can not convert ${type} to ${destType}`);
//     }
// };

// IfStatement.analyze = function (context) {
//     this.predicate.analyze(context);
//     this.consequent.forEach(e => e.analyze(context));
//     this.alternate.forEach(e => e.analyze(context));
//     return this;
// };

// WhileStatement.analyze = function (context) {
//     this.predicate.analyze(context);
//     this.block.forEach(e => e.analyze(context));
//     return this;
// };

// CallStatement.analyze = function (context) {
//     this.expression.analyze(context);
// };

// ReturnStatement.analyze = function (context) {
//     this.expression.forEach(e => e.analyze(context));
// };

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

Expression.generate = function (_context, _register) {
    throw new Error('Not implemented');
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

Literal.generate = function () {
    let value = `#${this.value}`;
    return {
        address: value,
        instructions: [],
    };
};

Variable.generate = function (context) {
    let name = context.isLocal(this.name) ? `${context.getCurrentMethod()}_${this.name}` : `${this.name}`;
    return {
        address: name,
        instructions: [],
    };
};
