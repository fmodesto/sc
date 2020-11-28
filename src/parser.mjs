import ohm from 'ohm-js';
import fs from 'fs';
import {
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
} from './ast.mjs';
import CompileError from './error.mjs';

const grammar = ohm.grammar(fs.readFileSync('src/sc.ohm'));
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
    Global(type, id, _1, exp, _2) {
        return GlobalDeclaration.create({
            type: type.sourceString,
            name: id.sourceString,
            expression: exp.ast(),
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
        return names.asIteration().ast().map(e => Var.create({
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
                        expression: id.sourceString,
                        source: this.source.getLineAndColumnMessage(),
                    }),
                    rhs: exp.ast(),
                    source: this.source.getLineAndColumnMessage(),
                }),
                source: this.source.getLineAndColumnMessage(),
            });
        }
    },
    Stmt_if(_if, _opp, condition, _cpp, _opb1, consequent, _clb1, alternate) {
        return IfStatement.create({
            condition: condition.ast(),
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
    Stmt_while(_while, _opp, condition, _clp, _opb, block, _clb) {
        return WhileStatement.create({
            condition: condition.ast(),
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
    Exp_if(condition, _1, consequent, _2, alternate) {
        return TernaryOperation.create({
            condition: condition.ast(),
            consequent: consequent.ast(),
            alternate: alternate.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
    },
    Exp0_binary : createBinary,
    Exp1_binary : createBinary,
    Exp2_binary : createBinary,
    Exp3_binary : createBinary,
    Exp4_binary : createBinary,
    Exp5_binary : createBinary,
    Exp6_binary : createBinary,
    Exp7_binary : createBinary,
    Exp8_unary(op, exp) {
        return UnaryOperation.create({
            operation: op.sourceString,
            expression: exp.ast(),
            source: this.source.getLineAndColumnMessage(),
        });
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
    intlit(_) {
        return Literal.create({
            type: +this.sourceString < 256 ? 'byte' : 'short',
            value: +this.sourceString,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    hexlit(_) {
        return Literal.create({
            type: +this.sourceString < 256 ? 'byte' : 'short',
            value: +this.sourceString,
            source: this.source.getLineAndColumnMessage(),
        });
    },
    VarExp(_) {
        return Variable.create({
            name: this.sourceString,
            source: this.source.getLineAndColumnMessage(),
        });
    }
});

const parse = (src) => {
    let m = grammar.match(src);
    if (m.failed()) {
        throw CompileError.create(m.message);
    }
    return semantics(m).ast();
}

export default parse;
