import {
    AST,
    BinaryOperation,
    UnaryOperation,
    Literal,
    AssignmentStatement,
    TernaryOperation,
    IfStatement,
    Variable,
} from './ast.js';
import { word, byte, isPowerOfTwo, logTwo } from './binary.js';

const isLiteral = (e) => Literal.isPrototypeOf(e);
const isNumberLiteral = (e) => isLiteral(e) && (e.type === 'int' || e.type === 'char');
const isZero = (e) => isLiteral(e) && e.value === 0;
const isOne = (e) => isLiteral(e) && e.value === 1;
const isPower = (e) => isLiteral(e) && isPowerOfTwo(e.value);
const power = ({value, source}) => createCharLiteral(logTwo(value), source);

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

const createUnary = function (operation, expression, source) {
    return UnaryOperation.create({
        operation,
        expression,
        source,
    });
};

const createBinary = function (operation, lhs, rhs, source) {
    return BinaryOperation.create({
        operation,
        lhs,
        rhs,
        source,
    });
};


AST.optimize = function () {
    let properties = {};
    Object.keys(this).forEach((p) => {
        if (Array.isArray(this[p])) {
            properties[p] = this[p].map((e) => (AST.isPrototypeOf(e) ? e.optimize() : e)).flat();
        } else if (AST.isPrototypeOf(this[p])) {
            properties[p] = this[p].optimize();
        } else {
            properties[p] = this[p];
        }
    });
    return Object.getPrototypeOf(this).create(properties);
};

AssignmentStatement.optimize = function () {
    let assign = (expression, source) => AssignmentStatement.create({ name: this.name, expression, source: source });
    let exp = this.expression.optimize();
    if (TernaryOperation.isPrototypeOf(exp)) {
        return IfStatement.create({
            predicate: exp.predicate,
            consequent: [assign(exp.consequent, exp.source)],
            alternate: [assign(exp.alternate, exp.source)],
            source: this.source,
        }).optimize();
    } else if (Variable.isPrototypeOf(exp) && exp.name === this.name) {
        return [];
    } else {
        return assign(exp, this.source);
    }
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
    return createUnary(this.operation, expression, this.source);
};

BinaryOperation.optimize = function () {
    let lhs = this.lhs.optimize();
    let rhs = this.rhs.optimize();
    if (isNumberLiteral(lhs) && isNumberLiteral(rhs)) {
        return this.foldNumberConstants(lhs, rhs);
    } else if (isLiteral(lhs) && isLiteral(rhs)) {
        return this.foldBoolConstants(lhs, rhs);
    } else if (this.operation === '+') {
        if (isZero(rhs)) return lhs;
        if (isZero(lhs)) return rhs;
    } else if (this.operation === '-') {
        if (isZero(rhs)) return lhs;
        if (isZero(lhs)) return createUnary('-', rhs, this.source);
    } else if (this.operation === '*') {
        if (isOne(rhs)) return lhs;
        if (isOne(lhs)) return rhs;
        if (isPower(lhs)) return createBinary('<<', rhs, power(lhs), this.source);
        if (isPower(rhs)) return createBinary('<<', lhs, power(rhs), this.source);
    } else if (this.operation === '/') {
        if (isOne(rhs)) return lhs;
        if (isPower(rhs)) return createBinary('>>', lhs, power(rhs), this.source);
    } else if (this.operation === '<<') {
        if (isZero(rhs)) return lhs;
    } else if (this.operation === '>>') {
        if (isZero(rhs)) return lhs;
    }
    return createBinary(this.operation, lhs, rhs, this.source);
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
