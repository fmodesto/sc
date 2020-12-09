import {
    AST,
    BinaryOperation,
    UnaryOperation,
    Literal,
} from './ast.js';
import { word, byte } from './binary.js';

const isLiteral = (e) => Literal.isPrototypeOf(e);
const isNumberLiteral = (e) => isLiteral(e) && (e.type === 'int' || e.type === 'char');

const createIntLiteral = function (value, source) {
    return Literal.create({
        type: 'int',
        value: word(value),
        source,
    });
};

const createCharLiteral = function (value, source) {
    return Literal.create({
        type: 'char',
        value: byte(value),
        source,
    });
};

const createBoolLiteral = function (value, source) {
    return Literal.create({
        type: 'bool',
        value: value ? 1 : 0,
        source,
    });
};

AST.optimize = function () {
    let properties = {};
    Object.keys(this).forEach((p) => {
        if (Array.isArray(this[p])) {
            properties[p] = this[p].map((e) => (AST.isPrototypeOf(e) ? e.optimize() : e));
        } else if (AST.isPrototypeOf(this[p])) {
            properties[p] = this[p].optimize();
        } else {
            properties[p] = this[p];
        }
    });
    return Object.getPrototypeOf(this).create(properties);
};

UnaryOperation.optimize = function () {
    let expression = this.expression.optimize();
    let createLiteral = expression.type === 'int' ? createIntLiteral : createCharLiteral;
    if (isLiteral(expression)) {
        switch (this.operation) {
            case '-':
                return createLiteral(-expression.value, this.source);
            case '!':
                return createBoolLiteral(!expression.value, this.source);
            case '~':
                return createLiteral(~expression.value, this.source);
            case 'bool':
                return createBoolLiteral(!!expression.value, this.source);
            case 'char':
                return createCharLiteral(expression.value, this.source);
            case 'int':
                return createIntLiteral(expression.value, this.source);
            default:
                throw new Error(`Unimplemented for operation ${this.operation}`);
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
    if (isNumberLiteral(lhs) && isNumberLiteral(rhs)) {
        return this.foldNumberConstants(lhs, rhs);
    } else if (isLiteral(lhs) && isLiteral(rhs)) {
        return this.foldBoolConstants(lhs, rhs);
    } else {
        return BinaryOperation.create({
            operation: this.operation,
            lhs,
            rhs,
            source: this.source,
        });
    }
};

BinaryOperation.foldNumberConstants = function (lhs, rhs) {
    const x = lhs.value;
    const y = rhs.value;
    const intType = lhs.type === 'int' || rhs.type === 'int';
    const createLiteral = intType ? createIntLiteral : createCharLiteral;
    switch (this.operation) {
        case '+':
            return createLiteral(x + y, this.source);
        case '-':
            return createLiteral(x - y, this.source);
        case '*':
            return createLiteral(x * y, this.source);
        case '/':
            return createLiteral(x / y, this.source);
        case '%':
            return createLiteral(x % y, this.source);
        case '<<':
            return createLiteral(intType ? (x & 0xFFFF) << (y & 0x0F) : (x & 0xFF) << (y & 0x07), this.source);
        case '>>':
            return createLiteral(intType ? (x & 0xFFFF) >>> (y & 0x0F) : (x & 0xFF) >>> (y & 0x07), this.source);
        case '&':
            return createLiteral(x & y, this.source);
        case '|':
            return createLiteral(x | y, this.source);
        case '^':
            return createLiteral(x ^ y, this.source);
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
            throw new Error(`Unknown char operation to fold: ${this.operation}`);
    }
};

BinaryOperation.foldBoolConstants = function (lhs, rhs) {
    const x = lhs.value;
    const y = rhs.value;
    switch (this.operation) {
        case '==':
            return createBoolLiteral(!!x === !!y, this.source);
        case '!=':
            return createBoolLiteral(!!x !== !!y, this.source);
        case '&&':
            return createBoolLiteral(!!x && !!y, this.source);
        case '||':
            return createBoolLiteral(!!x || !!y, this.source);
        default:
            throw new Error(`Unknown bool operation to fold: ${this.operation}`);
    }
};
