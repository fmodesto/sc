import ohm from 'ohm-js';
import fs from 'fs';
import {
    Program,
    GlobalDeclaration,
    ArrayDeclaration,
    ArrayContents,
    MethodDeclaration,
    Var,
    AssignmentStatement,
    ArrayStatement,
    IfStatement,
    ForStatement,
    DoStatement,
    WhileStatement,
    CallStatement,
    ReturnStatement,
    TernaryOperation,
    BinaryOperation,
    UnaryOperation,
    ArrayAccess,
    MethodCall,
    Literal,
    Variable,
} from './ast.js';
import CompileError from './error.js';
import { byte, word } from './binary.js';

const grammar = ohm.grammar(fs.readFileSync('compiler/src/sc.ohm'));
const semantics = grammar.createSemantics();

function createBinary(lhs, op, rhs) {
    return BinaryOperation.create({
        operation: op.sourceString,
        lhs: lhs.ast(),
        rhs: rhs.ast(),
        source: this.source.getLineAndColumnMessage(),
    });
}

function initArray(dimensions, source) {
    if (dimensions.length === 0) {
        return Literal.create({ value: 0, type: 'char', source });
    }
    return ArrayContents.create({
        source,
        elements: Array(dimensions[0]).fill(initArray(dimensions.slice(1), source)),
    });
}

semantics.addOperation('ast', {
    Program(_1, globals, methods) {
        return Program.create({
            globals: globals.ast(),
            methods: methods.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Global_mem(register, typeNode, id, initialization, _1) {
        let type = typeNode.sourceString;
        let source = this.source.getLineAndColumnMessage();
        let expression = initialization.numChildren === 0 ? Literal.create({ value: 0, type, source }) : initialization.child(0).ast();
        return GlobalDeclaration.create({
            type,
            name: id.sourceString,
            address: register.ast(),
            expression: expression,
            source,
        });
    },
    Global_array(register, type, id, dim, initialization, _1) {
        let source = this.source.getLineAndColumnMessage();
        let dimensions = dim.ast();
        let value = initialization.numChildren === 0 ? initArray(dimensions, source) : initialization.child(0).ast();
        return ArrayDeclaration.create({
            type: type.sourceString,
            dimensions,
            address: register.ast(),
            value,
            name: id.sourceString,
            source,
        });
    },
    Register(_1, _2, address, _3) {
        return +address.sourceString;
    },
    GlobalValue(_1, exp) {
        return exp.ast();
    },
    GlobalArray(_1, initialization) {
        return initialization.ast();
    },
    ArrayDim(_1, size, _2) {
        return +size.sourceString;
    },
    ArrayInit_block(_1, elements, _2) {
        return ArrayContents.create({
            elements: elements.asIteration().ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Method_declaration(type, name, _1, params, _2, _3, vars, statements, _4) {
        return MethodDeclaration.create({
            type: type.sourceString,
            name: name.sourceString,
            parameters: params.asIteration().ast(),
            vars: vars.ast().flat(),
            statements: statements.ast(),
            declaration: true,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Method_extern(type, name, _1, params, _2, _3) {
        return MethodDeclaration.create({
            type: type.sourceString,
            name: name.sourceString,
            parameters: params.asIteration().ast(),
            declaration: false,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Param(type, name) {
        return Var.create({
            type: type.sourceString,
            name: name.sourceString,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Vars(type, names, _1) {
        return names.asIteration().ast().map((e) => Var.create({
            type: type.sourceString,
            name: e,
            source: this.source.getLineAndColumnMessage(),
        }));
    },
    Var(name) {
        return name.sourceString;
    },
    Statements(statements, returnStatement) {
        return [...statements.ast(), ...returnStatement.ast()];
    },
    Stmt_assign(assign, _1) {
        return assign.ast();
    },
    Assignment_simple(id, op, exp) {
        if (op.sourceString === '=') {
            return AssignmentStatement.create({
                name: id.sourceString,
                expression: exp.ast(),
                source: this.source.getLineAndColumnMessage(),
            });
        } else {
            return AssignmentStatement.create({
                name: id.sourceString,
                expression: BinaryOperation.create({
                    operation: op.sourceString.substring(0, op.sourceString.length - 1),
                    lhs: Variable.create({
                        name: id.sourceString,
                        source: this.source.getLineAndColumnMessage(),
                    }),
                    rhs: exp.ast(),
                    source: this.source.getLineAndColumnMessage(),
                }),
                source: this.source.getLineAndColumnMessage(),
            });
        }
    },
    Assignment_array(id, access, op, exp) {
        if (op.sourceString === '=') {
            return ArrayStatement.create({
                name: id.sourceString,
                access: access.ast(),
                compound: false,
                expression: exp.ast(),
                source: this.source.getLineAndColumnMessage(),
            });
        } else {
            let index = access.ast();
            return ArrayStatement.create({
                name: id.sourceString,
                access: index,
                compound: true,
                expression: BinaryOperation.create({
                    operation: op.sourceString.substring(0, op.sourceString.length - 1),
                    lhs: ArrayAccess.create({
                        name: id.sourceString,
                        access: index,
                        compound: true,
                        source: this.source.getLineAndColumnMessage(),
                    }),
                    rhs: exp.ast(),
                    source: this.source.getLineAndColumnMessage(),
                }),
                source: this.source.getLineAndColumnMessage(),
            });
        }
    },
    Stmt_if(_if, _opp, predicate, _cpp, _opb1, consequent, _clb1, alternate) {
        return IfStatement.create({
            predicate: predicate.ast(),
            consequent: consequent.ast(),
            alternate: alternate.ast().flat(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Else_block(_1, _2, statements, _3) {
        return statements.ast();
    },
    Else_if(_1, statement) {
        return [statement.ast()];
    },
    Stmt_for(_for, _opp, assign, _sc1, predicate, _sc2, iteration, _clp, _opb, block, _clb) {
        return ForStatement.create({
            initialize: assign.asIteration().ast(),
            predicate: predicate.ast(),
            iteration: iteration.asIteration().ast(),
            block: block.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Stmt_do(_do, _opb, block, _clb, _while, _opp, predicate, _clp, _sc) {
        return DoStatement.create({
            predicate: predicate.ast(),
            block: block.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Stmt_while(_while, _opp, predicate, _clp, _opb, block, _clb) {
        return WhileStatement.create({
            predicate: predicate.ast(),
            block: block.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Stmt_call(expression, _semi) {
        return CallStatement.create({
            expression: MethodCall.create({
                ...expression.ast(),
                statement: true,
            }),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    ReturnStmt(_1, exp, _2) {
        return ReturnStatement.create({
            expression: exp.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Exp_if(predicate, _1, consequent, _2, alternate) {
        return TernaryOperation.create({
            predicate: predicate.ast(),
            consequent: consequent.ast(),
            alternate: alternate.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Exp0_binary: createBinary,
    Exp1_binary: createBinary,
    Exp2_binary: createBinary,
    Exp3_binary: createBinary,
    Exp4_binary: createBinary,
    Exp5_binary: createBinary,
    Exp6_binary: createBinary,
    Exp7_binary: createBinary,
    Exp8_unary(op, exp) {
        return UnaryOperation.create({
            operation: op.sourceString,
            expression: exp.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Exp8_cast(_1, type, _2, exp) {
        return UnaryOperation.create({
            operation: type.sourceString,
            expression: exp.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Exp9_parens(_1, exp, _2) {
        return exp.ast();
    },
    MethodCall(id, _1, exp, _2) {
        return MethodCall.create({
            name: id.sourceString,
            parameters: exp.asIteration().ast(),
            source: this.source.getLineAndColumnMessage(),
            statement: false,
        });
    },
    boollit(_) {
        return Literal.create({
            type: 'bool',
            value: this.sourceString === 'true' ? 1 : 0,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    intlit(val, suffix) {
        let num = +val.sourceString;
        if (num >= 32768) {
            throw CompileError.create(this.source.getLineAndColumnMessage(), `Value ${num} exceeds 'int'`);
        }
        return Literal.create({
            type: num < 128 && !suffix.sourceString ? 'char' : 'int',
            value: num,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    neglit(_1, val, suffix) {
        let num = -val.sourceString;
        if (num < -32768) {
            throw CompileError.create(this.source.getLineAndColumnMessage(), `Value ${num} exceeds 'int'`);
        }
        return Literal.create({
            type: num < -128 || suffix.sourceString ? 'int' : 'char',
            value: num,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    hexlit(val, suffix) {
        let num = +val.sourceString;
        if (num >= 65536) {
            throw CompileError.create(this.source.getLineAndColumnMessage(), `Value ${num} exceeds 'int'`);
        }
        let type = num < 256 && !suffix.sourceString ? 'char' : 'int';
        let value = type === 'char' ? byte(num) : word(num);
        return Literal.create({
            type,
            value,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    VarExp(_) {
        return Variable.create({
            name: this.sourceString,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    ArrayExp(id, access) {
        return ArrayAccess.create({
            name: id.sourceString,
            access: access.ast(),
            compound: false,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    ArrayAccess(_1, exp, _2) {
        return exp.ast();
    },
});

const parse = (src, rule) => {
    let m = grammar.match(src, rule);
    if (m.failed()) {
        throw CompileError.create(m.message);
    }
    return semantics(m).ast();
};

export default parse;
