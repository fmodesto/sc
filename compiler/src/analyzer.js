import {
    Program,
    GlobalDeclaration,
    ArrayDeclaration,
    Var,
    Statement,
    AssignmentStatement,
    IfStatement,
    ForStatement,
    DoStatement,
    WhileStatement,
    CallStatement,
    ReturnStatement,
    Expression,
    TernaryOperation,
    BinaryOperation,
    UnaryOperation,
    ArrayAccess,
    MethodCall,
    Literal,
    Variable,
    ArrayContents,
    ArrayStatement,
    SourceMethod,
    AsmMethod,
    ExternMethod,
} from './ast.js';
import { nearPower } from './binary.js';
import createContext from './context.js';
import CompileError from './error.js';

const integerUnaryOperations = ['-', '~'];
const integerBinaryOperations = ['+', '-', '*', '/', '%', '<<', '>>', '&', '|', '^'];
const shiftOperations = ['<<', '>>'];

const booleanOperations = ['&', '|', '^', '==', '!=', '||', '&&'];

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
    if (left === right) {
        return left;
    } else if ((left === 'int' && right === 'char') || (left === 'char' && right === 'int')) {
        return 'int';
    } else if (left === 'bool' || right === 'bool') {
        return 'bool';
    } else {
        throw CompileError.create(source, `Incompatible types: can not convert between '${left}' and '${right}'`);
    }
};

const analyzeArray = function (context, { name, access, source }) {
    if (!context.containsArray(name)) {
        throw CompileError.create(source, `Variable '${name}' not defined`);
    }
    let definedDimension = context.getArrayDimensions(name);
    if (definedDimension.length !== access.length) {
        throw CompileError.create(source, `Array access doesn't match dimensions. Expected ${definedDimension.length} found ${access.length}`);
    }
    access.forEach((e) => e.analyze(context));
};

Program.analyze = function (context = createContext()) {
    this.globals.forEach((e) => e.analyze(context));
    this.methods.forEach((e) => {
        if (context.contains(e.name)) {
            throw CompileError.create(e.source, `Redefinition of '${e.name}'`);
        }
        context.addMethod(e.name, e.type, e.parameters.map((p) => p.type));
    });
    this.methods.forEach((e) => e.analyze(context.createContext(e.name)));
};

GlobalDeclaration.analyze = function (context) {
    this.expression.analyze(context);
    let expression = this.expression.optimize();
    if (context.contains(this.name)) {
        throw CompileError.create(this.source, `Redefinition of '${this.name}'`);
    }
    if (!Literal.isPrototypeOf(expression)) {
        throw CompileError.create(this.expression.source, 'Expression must have a constant value');
    }
    if (!compatibleType(this.type, expression.type)) {
        throw CompileError.create(this.source, `Incompatible types: can not convert '${expression.type}' to '${this.type}'`);
    }
    context.addVar(this.name, this.type);
};

const computeArraySize = function (type, dimensions) {
    if (type === 'int') {
        return 2 * dimensions.reduce((a, e) => a * e, 1);
    } else if (type === 'char') {
        return dimensions.reduce((a, e) => a * e, 1);
    } else if (type === 'bool') {
        let last = dimensions.length - 1;
        return dimensions.reduce((a, e, i) => a * (i === last ? Math.max(1, e / 8) : e), 1);
    } else {
        throw new Error(`Unknown type ${type}`);
    }
};

ArrayDeclaration.analyze = function (context) {
    if (context.contains(this.name)) {
        throw CompileError.create(this.source, `Redefinition of '${this.name}'`);
    }
    if (this.dimensions.some((e) => e < 1)) {
        throw CompileError.create(this.source, 'Array with 0 length');
    }
    if (this.dimensions.some((e) => e > 256)) {
        throw CompileError.create(this.source, 'Array index exceeds \'256\'');
    }
    let dimensions = this.dimensions.map((e, i) => (i === 0 ? e : nearPower(e)));
    let size = computeArraySize(this.type, dimensions);
    if (size > 256) {
        throw CompileError.create(this.source, `Array does't fit in memory '${this.name}[${dimensions.join(',')}]'`);
    }
    this.value.checkDimensions(this.type, this.dimensions);
    context.addArray(this.name, this.type, dimensions);
};

ArrayContents.checkDimensions = function (type, dimensions) {
    if (this.elements.length !== dimensions[0]) {
        throw CompileError.create(this.source, `Array initialization doesn't match dimensions. Expected ${dimensions[0]} found ${this.elements.length}`);
    }
    if (dimensions.length === 1) {
        this.elements.forEach((e) => {
            if (!Literal.isPrototypeOf(e)) {
                throw CompileError.create(e.source, 'Expecting list of literals');
            } else if (!compatibleType(type, e.type) || (type === 'bool' && e.value !== 0 && e.value !== 1)) {
                throw CompileError.create(e.source, `Incompatible types: can not convert '${e.type}' to '${type}'`);
            }
        });
    } else {
        this.elements.forEach((e) => {
            if (!ArrayContents.isPrototypeOf(e)) {
                throw CompileError.create(e.source, 'Expecting array initialization');
            }
            e.checkDimensions(type, dimensions.slice(1));
        });
    }
};

SourceMethod.analyze = function (context) {
    this.parameters.forEach((e) => e.analyze(context));
    this.vars.forEach((e) => e.analyze(context));
    this.statements.forEach((e) => e.analyze(context));
    if (this.type !== 'void' && !doesReturn(this.statements)) {
        throw CompileError.create(this.source, 'Missing return statement');
    }
};

AsmMethod.analyze = function (context) {
    this.parameters.forEach((e) => e.analyze(context));
    this.vars.forEach((e) => e.analyze(context));
};

ExternMethod.analyze = function () {
};

Var.analyze = function (context) {
    this.expression.analyze(context);
    let expression = this.expression.optimize();
    if (context.contains(this.name)) {
        throw CompileError.create(this.source, `Redefinition of '${this.name}'`);
    }
    if (!Literal.isPrototypeOf(expression)) {
        throw CompileError.create(this.expression.source, 'Expression must have a constant value');
    }
    if (!compatibleType(this.type, expression.type)) {
        throw CompileError.create(this.source, `Incompatible types: can not convert '${expression.type}' to '${this.type}'`);
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

ArrayStatement.analyze = function (context) {
    if (!this.compound) {
        analyzeArray(context, this);
    }
    const destType = context.getArrayType(this.name);
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

ForStatement.analyze = function (context) {
    this.initialize.forEach((e) => e.analyze(context));
    this.predicate.forEach((e) => e.analyze(context));
    this.iteration.forEach((e) => e.analyze(context));
    this.block.forEach((e) => e.analyze(context));
    return this;
};

DoStatement.analyze = function (context) {
    this.predicate.analyze(context);
    this.block.forEach((e) => e.analyze(context));
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
    throw new Error(`Not implemented: ${this.kind}.analyze()`);
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
        } else if (rhsType === 'int' && shiftOperations.includes(this.operation)) {
            throw CompileError.create(this.source, `Invalid types for operation: '${lhsType}' ${this.operation} '${rhsType}'`);
        }
        return combineType(this.source, lhsType, rhsType);
    } else if (relationalOperations.includes(this.operation)) {
        if (lhsType === 'bool' || rhsType === 'bool') {
            throw CompileError.create(this.source, `Invalid types for operation: '${lhsType}' ${this.operation} '${rhsType}'`);
        } else if (lhsType === 'char' && rhsType === 'int' && Literal.isPrototypeOf(this.rhs.optimize())) {
            throw CompileError.create(this.source, `Logical comparison of constant out of range: '${lhsType}' ${this.operation} 'int constant'`);
        } else if (lhsType === 'int' && rhsType === 'char' && Literal.isPrototypeOf(this.lhs.optimize())) {
            throw CompileError.create(this.source, `Logical comparison of constant out of range: 'int constant' ${this.operation} '${rhsType}'`);
        }
        return 'bool';
    } else if (logicBinaryOperations.includes(this.operation)) {
        return 'bool';
    } else {
        throw new Error(`Unknown operation ${this.operation}`);
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
            throw CompileError.create(this.parameters[i].source, `Incompatible types: can not convert '${type}' to '${destType}'`);
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

ArrayAccess.analyze = function (context) {
    analyzeArray(context, this);
    return context.getArrayType(this.name);
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
