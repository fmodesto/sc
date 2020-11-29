import parse from '../parser.mjs';

const ast = (src) => JSON.parse(parse(src).ast());

describe('AST', () => {
    test('Simple program', (done) => {
        let src = `
            byte a = 1;

            byte foo(byte b) {
                return a + b;
            }
        `;
        expect(ast(src)).toStrictEqual({
            kind: 'Program',
            globals: [
                {
                    kind: 'GlobalDeclaration',
                    type: 'byte',
                    name: 'a',
                    expression: {
                        kind: 'Literal',
                        type: 'byte',
                        value: 1,
                    },
                },
            ],
            methods: [
                {
                    kind: 'MethodDeclaration',
                    type: 'byte',
                    name: 'foo',
                    parameters: [
                        {
                            kind: 'Var',
                            type: 'byte',
                            name: 'b',
                        },
                    ],
                    vars: [],
                    statements: [
                        {
                            kind: 'ReturnStatement',
                            expression: [
                                {
                                    kind: 'BinaryOperation',
                                    operation: '+',
                                    lhs: {
                                        kind: 'Variable',
                                        name: 'a',
                                    },
                                    rhs: {
                                        kind: 'Variable',
                                        name: 'b',
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        done();
    });
});
