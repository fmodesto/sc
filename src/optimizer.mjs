import {
    AST,
    BinaryOperation,
    UnaryOperation,
    Literal,
} from './ast.mjs';

const isLiteral = e => Literal.isPrototypeOf(e);
const isByteLiteral = e => isLiteral(e) && e.type === 'byte';

const createByteLiteral = (value, source) => {
    let val = (value | 0) & 0xFF;
    if (val > 127) {
        val = -(256 - val);
    }
    return Literal.create({
        type: 'byte',
        value: val,
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
                return createByteLiteral(-expression.value, this.source);
            case "!":
                return createBoolLiteral(!expression.value, this.source);
            case "~":
                return createByteLiteral(~expression.value & 0xFF, this.source);
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
        return this.foldByteConstants(lhs, rhs);
    } else if (isLiteral(lhs) && isLiteral(rhs)) {
        return this.foldBoolConstants(lhs, rhs);
    }
    return BinaryOperation.create({
        operation: this.operation,
        lhs,
        rhs,
        source: this.source,
    });
};

BinaryOperation.foldByteConstants = function (lhs, rhs) {
    const x = lhs.value;
    const y = rhs.value;
    switch (this.operation) {
        case '+':
            return createByteLiteral(x + y, this.source);
        case '-':
            return createByteLiteral(x - y, this.source);
        case '*':
            return createByteLiteral(x * y, this.source);
        case '/':
            return createByteLiteral(x / y, this.source);
        case '%':
            return createByteLiteral(x % y, this.source);
        case '<<':
            return createByteLiteral((x << y) & 0xFF, this.source);
        case '>>':
            return createByteLiteral((x & 0xFF) >>> y, this.source);
        case '&':
            return createByteLiteral((x & 0xFF) & (y & 0xFF), this.source);
        case '|':
            return createByteLiteral((x & 0xFF) | (y & 0xFF), this.source);
        case '^':
            return createByteLiteral((x & 0xFF) ^ (y & 0xFF), this.source);
        case '<':
            return createBoolLiteral(x < y, this.source);
        case '<=':
            return createBoolLiteral(x <= y, this.source);
        case '==':
            return createBoolLiteral(x === y, this.source);
        case '!=':
            return createBoolLiteral(x !== y, this.source);
        case '>=':
            return createBoolLiteral(x >= y, this.source);
        case '>':
            return createBoolLiteral(x > y, this.source);
        case '&&':
            return createBoolLiteral(!!x && !!y, this.source);
        case '||':
            return createBoolLiteral(!!x || !!y, this.source);
        default:
            throw new Error('Unknown byte operation to fold: ' + this.operation);
    }
}

BinaryOperation.foldBoolConstants = function (lhs, rhs) {
    const x = lhs.value;
    const y = rhs.value;
    switch (this.operation) {
        case '==':
            return createBoolLiteral(!!x == !!y, this.source);
        case '!=':
            return createBoolLiteral(!!x !== !!y, this.source);
        case '&&':
            return createBoolLiteral(!!x && !!y, this.source);
        case '||':
            return createBoolLiteral(!!x || !!y, this.source);
        default:
            throw new Error('Unknown bool operation to fold: ' + this.operation);
    }
}
