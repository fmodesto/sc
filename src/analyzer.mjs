import {
    AST,
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
} from './ast.mjs';
import createContext from './context.mjs';
import CompileError from './error.mjs';

const compatibleType = function (dest, src) {
    return dest === 'bool' || src === dest;
}

Program.analyze = function (context) {
    this.globals.forEach(e => e.analyze(context));
    this.methods.forEach(e => {
        if (context.containsMethod(e.name)) {
            throw CompileError.create(e.source, `Method '${e.name}' already defined`);
        }
        context.addMethod(e.name, e.type, e.parameters.map(p => p.type))
    });
    this.methods.forEach(e => e.analyze(context.createContext()));
};

GlobalDeclaration.analyze = function (context) {
    const src = this.expression.source;
    this.expression.analyze(context);
    this.expression = this.expression.optimize();
    if (!Literal.isPrototypeOf(this.expression)) {
        throw CompileError.create(src, `Expression must have a constant value`);
    }
    if (context.containsVar(this.name)) {
        throw CompileError.create(this.source, `Variable '${this.name}' already defined`);
    }
    if (!compatibleType(this.type, this.expression.type)) {
        throw CompileError.create(this.source, `Type missmatch. Can not convert ${this.expression.type} to ${this.type}`);
    }
    context.addVar(this.name, this.type);
};

MethodDeclaration.analyze = function (context) {
    this.parameters.forEach(e => e.analyze(context));
    this.vars.forEach(e => e.analyze(context));
    this.statements.forEach(e => e.analyze(context));
};

Var.analyze = function (context) {
    if (context.containsVar(this.name)) {
        throw CompileError.create(this.source, `Variable '${this.name}' already defined`);
    }
    context.addVar(this.name, this.type);
};

AssignmentStatement.analyze = function (context) {
    if (!context.containsVar(this.name)) {
        throw CompileError.create(this.source, `Variable ${this.name} not defined`);
    }
    const destType = context.getVarType(this.name);
    let type = this.expression.analyze(context);
    console.log(destType, type, compatibleType(destType, type));
    if (!compatibleType(destType, type)) {
        throw CompileError.create(this.source, `Type missmatch. Can not convert ${type} to ${destType}`);
    }
};

IfStatement.analyze = function (context) {
    this.condition.analyze(context);
    this.consequent.forEach(e => e.analyze(context));
    this.alternate.forEach(e => e.analyze(context));
    return this;
};

WhileStatement.analyze = function (context) {
    this.condition.analyze(context);
    this.block.forEach(e => e.analyze(context));
    return this;
};

CallStatement.analyze = function (context) {
    this.expression.analyze(context);
};

ReturnStatement.analyze = function (context) {
    this.expression.forEach(e => e.analyze(context));
};

Expression.analyze = function (context) {
    console.error(this.kind);
};

TernaryOperation.analyze = function (context) {
    // console.error(this.kind);
};

BinaryOperation.analyze = function (context) {
    // console.error(this.kind);
};

UnaryOperation.analyze = function (context) {
    // console.error(this.kind);
};

MethodCall.analyze = function (context) {
    if (!context.containsMethod(this.name)) {
        throw CompileError.create(this.source, `Method ${this.name} not defined`);
    }
    let params = this.parameters.map(e => e.analyze(context));
    let definedParams = context.getMethodParameters(this.name);
    if (params.length !== definedParams.length) {
        throw CompileError.create(this.source, `Arity missmatch, expected ${definedParams.length} parameters but found ${params.length}`);
    }
    definedParams.forEach((destType,i) => {
        let type = params[i];
        if (!compatibleType(destType, type)) {
            throw CompileError.create(this.parameters[i].source, `Type missmatch. Can not convert ${type} to ${destType}`);
        }
    });
    return context.getMethodType(this.name);
};

Literal.analyze = function (context) {
    return this.type;
};

Variable.analyze = function (context) {
    if (!context.containsVar(this.name)) {
        throw CompileError.create(this.source, `Variable ${this.name} not defined`);
    }
    return context.getVarType(this.name);
};

const analyze = (program) => {
    program.analyze(createContext());
};

export default analyze;
