import ohm from 'ohm-js';
import fs from 'fs';
import {
    Program,
    GlobalDeclaration,
    RegisterDeclaration,
    ArrayDeclaration,
    ArrayContents,
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
    ArrayAccess,
    MethodCall,
    Literal,
    Variable,
    ArrayStatement,
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

semantics.addOperation('ast', {
    Program(_1, globals, methods) {
        return Program.create({
            globals: globals.ast(),
            methods: methods.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Global_mem(type, id, _1, exp, _2) {
        return GlobalDeclaration.create({
            type: type.sourceString,
            name: id.sourceString,
            expression: exp.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Global_reg(_1, _2, address, _3, type, id, _4) {
        return RegisterDeclaration.create({
            type: type.sourceString,
            address: +address.sourceString,
            name: id.sourceString,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Global_array(type, id, dimensions, _1, initialization, _2) {
        return ArrayDeclaration.create({
            type: type.sourceString,
            dimensions: dimensions.ast(),
            value: initialization.ast(),
            name: id.sourceString,
            source: this.source.getLineAndColumnMessage(),
        });
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
    Method(type, name, _1, params, _2, _3, vars, statements, _4) {
        return MethodDeclaration.create({
            type: type.sourceString,
            name: name.sourceString,
            parameters: params.asIteration().ast(),
            vars: vars.ast().flat(),
            statements: statements.ast(),
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
    Stmt_assignment(id, op, exp, _1) {
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
    Stmt_array(id, access, op, exp, _1) {
        if (op.sourceString === '=') {
            return ArrayStatement.create({
                name: id.sourceString,
                access: access.ast(),
                compound: false,
                expression: exp.ast(),
                source: this.source.getLineAndColumnMessage(),
            });
        } else {
            return ArrayStatement.create({
                name: id.sourceString,
                compound: true,
                expression: BinaryOperation.create({
                    operation: op.sourceString.substring(0, op.sourceString.length - 1),
                    lhs: ArrayAccess.create({
                        name: id.sourceString,
                        access: access.ast(),
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
    Stmt_while(_while, _opp, predicate, _clp, _opb, block, _clb) {
        return WhileStatement.create({
            predicate: predicate.ast(),
            block: block.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Stmt_do(expression, _semi) {
        return CallStatement.create({
            expression: expression.ast(),
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
        if (num >= 32768 || num < -32768) {
            throw CompileError.create(this.source.getLineAndColumnMessage(), `Value ${num} exceeds 'int'`);
        }
        console.log(num);
        return Literal.create({
            type: (num >= -128 && num < 128) && !suffix.sourceString ? 'char' : 'int',
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
