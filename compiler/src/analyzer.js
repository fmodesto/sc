import {
    Program,
    GlobalDeclaration,
    MethodDeclaration,
    Var,
    Statement,
    AssignmentStatement,
    IfStatement,
    WhileStatement,
    CallStatement,
    ReturnStatement,
    Expression,
    TernaryOperation,
    BinaryOperation,
    UnaryOperation,
    MethodCall,
    Literal,
    Variable,
} from './ast.js';
import createContext from './context.js';
import CompileError from './error.js';

const integerUnaryOperations = ['-', '~'];
const integerBinaryOperations = ['+', '-', '*', '/', '%', '<<', '>>', '&', '|', '^'];

const booleanOperations = ['&', '|', '^', '==', '!='];

const logicUnaryOperations = ['!'];
const logicBinaryOperations = ['&&', '||'];

const relationalOperations = ['<=', '<', '==', '!=', '>=', '>'];

const castOperations = ['char', 'bool', 'int'];

const doesReturn = function (list) {
    return list.length !== 0 && list[list.length - 1].doesReturn();
};

const compatibleType = function (dest, src) {
    if (src === dest) {
        return true;
    } else if (src === 'void' || dest === 'void') {
        return false;
    } else if (dest === 'bool') {
        return true;
    } else if (dest === 'int' && src === 'char') {
        return true;
    } else {
        return false;
    }
};

const combineType = function (source, left, right) {
    if (left === 'bool' || right === 'bool') {
        return 'bool';
    } else if (left === right) {
        return left;
    } else if ((left === 'int' && right === 'char') || (left === 'char' && right === 'int')) {
        return 'int';
    } else {
        throw CompileError.create(source, `Incompatible types: can not convert between '${left}' and '${right}'`);
    }
};

Program.analyze = function (context = createContext()) {
    this.globals.forEach((e) => e.analyze(context));
    this.methods.forEach((e) => {
        if (context.containsMethod(e.name)) {
            throw CompileError.create(e.source, `Method '${e.name}' already defined`);
        }
        context.addMethod(e.name, e.type, e.parameters.map((p) => p.type));
    });
    this.methods.forEach((e) => e.analyze(context.createContext(e.name)));
};

GlobalDeclaration.analyze = function (context) {
    const src = this.expression.source;
    this.expression.analyze(context);
    let expression = this.expression.optimize();
    if (!Literal.isPrototypeOf(expression)) {
        throw CompileError.create(src, 'Expression must have a constant value');
    }
    if (context.containsVar(this.name)) {
        throw CompileError.create(this.source, `Variable '${this.name}' already defined`);
    }
    if (!compatibleType(this.type, expression.type)) {
        throw CompileError.create(this.source, `Incompatible types: can not convert '${expression.type}' to '${this.type}'`);
    }
    context.addVar(this.name, this.type);
};

MethodDeclaration.analyze = function (context) {
    this.parameters.forEach((e) => e.analyze(context));
    this.vars.forEach((e) => e.analyze(context));
    this.statements.forEach((e) => e.analyze(context));
    if (this.type !== 'void' && !doesReturn(this.statements)) {
        throw CompileError.create(this.source, 'Missing return statement');
    }
};

Var.analyze = function (context) {
    if (context.containsVar(this.name)) {
        throw CompileError.create(this.source, `Variable '${this.name}' already defined`);
    }
    context.addVar(this.name, this.type);
};

AssignmentStatement.analyze = function (context) {
    if (!context.containsVar(this.name)) {
        throw CompileError.create(this.source, `Variable '${this.name}' not defined`);
    }
    const destType = context.getVarType(this.name);
    let type = this.expression.analyze(context);
    if (!compatibleType(destType, type)) {
        throw CompileError.create(this.source, `Incompatible types: can not convert '${type}' to '${destType}'`);
    }
};

IfStatement.analyze = function (context) {
    this.predicate.analyze(context);
    this.consequent.forEach((e) => e.analyze(context));
    this.alternate.forEach((e) => e.analyze(context));
    return this;
};

WhileStatement.analyze = function (context) {
    this.predicate.analyze(context);
    this.block.forEach((e) => e.analyze(context));
    return this;
};

CallStatement.analyze = function (context) {
    this.expression.analyze(context);
};

ReturnStatement.analyze = function (context) {
    let destType = context.getMethodType();
    if (this.expression.length === 0) {
        if (destType !== 'void') {
            throw CompileError.create(this.source, 'Missing return a value');
        }
    } else {
        let type = this.expression[0].analyze(context);
        if (destType === 'void' && type === 'void') {
            throw CompileError.create(this.source, 'Incompatible types: unexpected return value');
        }
        if (!compatibleType(destType, type)) {
            throw CompileError.create(this.source, `Incompatible types: can not convert '${type}' to '${destType}'`);
        }
    }
};

Expression.analyze = function () {
    throw new Error('Not implemented');
};

TernaryOperation.analyze = function (context) {
    this.predicate.analyze(context);
    let consType = this.consequent.analyze(context);
    let altType = this.alternate.analyze(context);
    return combineType(this.source, consType, altType);
};

BinaryOperation.analyze = function (context) {
    let lhsType = this.lhs.analyze(context);
    let rhsType = this.rhs.analyze(context);
    if (lhsType === 'bool' && rhsType === 'bool') {
        if (!booleanOperations.includes(this.operation)) {
            throw CompileError.create(this.source, `Invalid types for operation: '${lhsType}' ${this.operation} '${rhsType}'`);
        }
        return 'bool';
    } else if (integerBinaryOperations.includes(this.operation)) {
        if (lhsType === 'bool' || rhsType === 'bool') {
            throw CompileError.create(this.source, `Invalid types for operation: '${lhsType}' ${this.operation} '${rhsType}'`);
        }
        return combineType(this.source, lhsType, rhsType);
    } else if (relationalOperations.includes(this.operation)) {
        if (lhsType === 'bool' || rhsType === 'bool') {
            throw CompileError.create(this.source, `Invalid types for operation: '${lhsType}' ${this.operation} '${rhsType}'`);
        }
        return 'bool';
    } else if (logicBinaryOperations.includes(this.operation)) {
        return 'bool';
    }
};

UnaryOperation.analyze = function (context) {
    let type = this.expression.analyze(context);
    if (integerUnaryOperations.includes(this.operation)) {
        if (type === 'bool') {
            throw CompileError.create(this.source, `Invalid type for operation: ${this.operation}'${type}'`);
        }
        return type;
    } else if (logicUnaryOperations.includes(this.operation)) {
        return 'bool';
    } else if (castOperations.includes(this.operation)) {
        return this.operation;
    } else {
        throw new Error(`Unknown operation ${this.operation}`);
    }
};

MethodCall.analyze = function (context) {
    if (!context.containsMethod(this.name)) {
        throw CompileError.create(this.source, `Method '${this.name}' not defined`);
    }
    let params = this.parameters.map((e) => e.analyze(context));
    let definedParams = context.getMethodParameters(this.name);
    if (params.length !== definedParams.length) {
        throw CompileError.create(this.source, `Arity missmatch, expected ${definedParams.length} parameters but found ${params.length}`);
    }
    definedParams.forEach((destType, i) => {
        let type = params[i];
        if (!compatibleType(destType, type)) {
            throw CompileError.create(this.parameters[i].source, `Type missmatch. Can not convert '${type}' to '${destType}'`);
        }
    });
    return context.getMethodType(this.name);
};

Literal.analyze = function () {
    return this.type;
};

Variable.analyze = function (context) {
    if (!context.containsVar(this.name)) {
        throw CompileError.create(this.source, `Variable '${this.name}' not defined`);
    }
    return context.getVarType(this.name);
};

Statement.doesReturn = function () {
    return false;
};

IfStatement.doesReturn = function () {
    return doesReturn(this.consequent) && doesReturn(this.alternate);
};

ReturnStatement.doesReturn = function () {
    return true;
};
