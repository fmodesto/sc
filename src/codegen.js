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
    // BinaryOperation,
    // UnaryOperation,
    // MethodCall,
    // Literal,
    // Variable,
} from './ast.js';
import createContext from './context.js';

const createRegisters = () => {
    let available = [];
    let counter = 0;
    return {
        fetch() {
            if (available.length !== 0) {
                return available.pop();
            } else {
                return counter++;
            }
        },
        release(index) {
            available.push(index);
        },
        total() {
            return counter;
        },
    };
};

Program.generate = function (context = createContext()) {
    this.globals.forEach((e) => context.addVar(e.name, e.type));
    this.methods.forEach((e) => context.addMethod(e.name, e.type, e.parameters.map((p) => ({ name: p.name, type: p.type }))));
    return [
        ...this.globals.map((e) => e.generate(context)).flat(),
        ...this.methods.map((e) => e.generate(context.createContext())).flat(),
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
    let register = createRegisters();
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

Expression.analyze = function (_context, _register) {
    throw new Error('Not implemented');
};
