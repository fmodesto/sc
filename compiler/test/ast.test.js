import parse from '../src/parser.js';

const ast = (src) => JSON.parse(parse(src).ast());

describe('AST', () => {
    test('Simple program', (done) => {
        let src = `
            char a = 1;

            char foo(char b) {
                return a + b;
            }
        `;
        expect(ast(src)).toStrictEqual({
            kind: 'Program',
            globals: [
                {
                    kind: 'GlobalDeclaration',
                    type: 'char',
                    name: 'a',
                    expression: {
                        kind: 'Literal',
                        type: 'char',
                        value: 1,
                    },
                },
            ],
            methods: [
                {
                    kind: 'MethodDeclaration',
                    type: 'char',
                    name: 'foo',
                    parameters: [
                        {
                            kind: 'Var',
                            type: 'char',
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
