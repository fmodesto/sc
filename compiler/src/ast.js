const AST = {
    create(props) {
        return Object.assign(Object.create(this), { kind: this.kind }, props);
    },
    ast() {
        return JSON.stringify(this, (key, value) => (key === 'source' ? undefined : value), 2);
    },
};
const Program = AST.create({
    kind: 'Program',
});
const GlobalDeclaration = AST.create({
    kind: 'GlobalDeclaration',
});
const RegisterDeclaration = AST.create({
    kind: 'RegisterDeclaration',
});
const ArrayDeclaration = AST.create({
    kind: 'ArrayDeclaration',
});
const ArrayContents = AST.create({
    kind: 'ArrayContents',
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
const ArrayStatement = Statement.create({
    kind: 'ArrayStatement',
});
const IfStatement = Statement.create({
    kind: 'IfStatement',
});
const ForStatement = Statement.create({
    kind: 'ForStatement',
});
const DoStatement = Statement.create({
    kind: 'DoStatement',
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
const ArrayAccess = Expression.create({
    kind: 'ArrayAccess',
});
AST.create = function (props) {
    return Object.freeze(Object.assign(Object.create(this), { kind: this.kind }, props));
};

export {
    AST,
    Program,
    GlobalDeclaration,
    RegisterDeclaration,
    ArrayDeclaration,
    ArrayContents,
    MethodDeclaration,
    Var,
    Statement,
    AssignmentStatement,
    ArrayStatement,
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
};
