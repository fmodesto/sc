import {
    AST,
    BinaryOperation,
    UnaryOperation,
    Literal,
} from './ast.mjs';

const isLiteral = (e) => Literal.isPrototypeOf(e);
const isByteLiteral = (e) => isLiteral(e) && e.type === 'byte';

const createByteLiteral = (value, source) => {
    return Literal.create({
        type: 'byte',
        value,
        source
    });
}

const createBoolLiteral = (value, source) => {
    return Literal.create({
        type: 'bool',
        value: value ? 1 : 0,
        source
    });
}

AST.optimize = function () {
    let properties = {};
    Object.keys(this).forEach(p => {
        if (Array.isArray(this[p])) {
            properties[p] = this[p].map(e => AST.isPrototypeOf(e) ? e.optimize() : e);
        } else if (AST.isPrototypeOf(this[p])) {
            properties[p] = this[p].optimize();
        } else {
            properties[p] = this[p];
        }
    });
    return this.__proto__.create(properties);
};

UnaryOperation.optimize = function () {
    let expression = this.expression.optimize();
    if (isLiteral(expression)) {
        switch (this.operation) {
            case "-":
                return createByteLiteral(-this.expression.value, this.expression.source);
            case "!":
                return createBoolLiteral(!this.expression.value, this.expression.source);
            case "~":
                return createByteLiteral(~this.expression.value, this.expression.source);
        }
    }
    return UnaryOperation.create({
        operation: this.operation,
        expression,
        source: this.source,
    });
};

BinaryOperation.optimize = function () {
    let lhs = this.lhs.optimize();
    let rhs = this.rhs.optimize();
    if (isByteLiteral(lhs) && isByteLiteral(rhs)) {
        return this.foldByteConstants();
    } else if (isLiteral(lhs) && isLiteral(rhs)) {
        return this.foldBoolConstants();
    }
    return BinaryOperation.create({
        operation: this.operation,
        lhs,
        rhs,
        source: this.source,
    });
};

BinaryOperation.foldByteConstants = function () {
    const x = this.lhs.value;
    const y = this.rhs.value;
    switch (this.operation) {
        case '+':
            return createByteLiteral(x + y, this.lhs.source);
        case '-':
            return createByteLiteral(x - y, this.lhs.source);
        case '*':
            return createByteLiteral(x * y, this.lhs.source);
        case '/':
            return createByteLiteral(x / y, this.lhs.source);
        case '%':
            return createByteLiteral(x % y, this.lhs.source);
        case '<<':
            return createByteLiteral(x << y, this.lhs.source);
        case '>>':
            return createByteLiteral(x >>> y, this.lhs.source);
        case '&':
            return createByteLiteral(x & y, this.lhs.source);
        case '|':
            return createByteLiteral(x | y, this.lhs.source);
        case '^':
            return createByteLiteral(x ^ y, this.lhs.source);
        case '<':
            return createBoolLiteral(x < y, this.lhs.source);
        case '<=':
            return createBoolLiteral(x <= y, this.lhs.source);
        case '==':
            return createBoolLiteral(x === y, this.lhs.source);
        case '!=':
            return createBoolLiteral(x !== y, this.lhs.source);
        case '>=':
            return createBoolLiteral(x >= y, this.lhs.source);
        case '>':
            return createBoolLiteral(x > y, this.lhs.source);
        case '&&':
            return createBoolLiteral(!!x && !!y, this.lhs.source);
        case '||':
            return createBoolLiteral(!!x || !!y, this.lhs.source);
        default:
            throw new Error('Unknown byte operation to fold: ' + this.op);
    }
}

BinaryOperation.foldBoolConstants = function () {
    const x = this.lhs.value;
    const y = this.rhs.value;
    switch (this.op) {
        case '==':
            return createBoolLiteral(!!x == !!y, this.lhs.source);
        case '!=':
            return createBoolLiteral(!!x !== !!y, this.lhs.source);
        case '&&':
            return createBoolLiteral(!!x && !!y, this.lhs.source);
        case '||':
            return createBoolLiteral(!!x || !!y, this.lhs.source);
        default:
            throw new Error('Unknown bool operation to fold: ' + this.op);
    }
}
