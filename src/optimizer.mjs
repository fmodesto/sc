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
    for (let p in this) {
        if (Array.isArray(this[p])) {
            this[p] = this[p].map(e => AST.isPrototypeOf(e) ? e.optimize() : e);
        } else if (AST.isPrototypeOf(this[p])) {
            this[p] = this[p].optimize();
        }
    }
    return this;
}

UnaryOperation.optimize = function () {
    this.expression = this.expression.optimize();
    if (isLiteral(this.expression)) {
        switch (this.operation) {
            case "-":
                return createByteLiteral(-this.expression.value, this.expression.source);
            case "!":
                return createBoolLiteral(!this.expression.value, this.expression.source);
            case "~":
                return createByteLiteral(~this.expression.value, this.expression.source);
        }
    }
    return this;
};

BinaryOperation.optimize = function () {
    this.lhs = this.lhs.optimize();
    this.rhs = this.rhs.optimize();
    if (isByteLiteral(this.lhs) && isByteLiteral(this.rhs)) {
        return this.foldByteConstants();
    } else if (isLiteral(this.lhs) && isLiteral(this.rhs)) {
        return this.foldBoolConstants();
    }
    return this;
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
