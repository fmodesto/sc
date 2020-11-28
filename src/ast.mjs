const AST = {
    create(props) {
        return Object.assign(Object.create(this), { kind: this.kind }, props);
    },
};
const Program = AST.create({
    kind: 'Program',
});
const GlobalDeclaration = AST.create({
    kind: 'GlobalDeclaration',
});
const MethodDeclaration = AST.create({
    kind: 'MethodDeclaration',
});
const Var = AST.create({
    kind: 'Var',
});
const Statement = AST.create();
const AssignmentStatement = Statement.create({
    kind: 'AssignmentStatement',
});
const IfStatement = Statement.create({
    kind: 'IfStatement',
});
const WhileStatement = Statement.create({
    kind: 'WhileStatement',
});
const CallStatement = Statement.create({
    kind: 'CallStatement',
});
const ReturnStatement = Statement.create({
    kind: 'ReturnStatement',
});
const Expression = AST.create();
const TernaryOperation = Expression.create({
    kind: 'TernaryOperation',
});
const BinaryOperation = Expression.create({
    kind: 'BinaryOperation',
});
const UnaryOperation = Expression.create({
    kind: 'UnaryOperation',
});
const MethodCall = Expression.create({
    kind: 'MethodCall',
});
const Literal = Expression.create({
    kind: 'Literal',
});
const Variable = Expression.create({
    kind: 'Variable',
});

export {
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
};
