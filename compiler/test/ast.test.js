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
        expect(ast(src)).toMatchObject({
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
                    address: [],
                },
            ],
            methods: [
                {
                    kind: 'SourceMethodDeclaration',
                    type: 'char',
                    name: 'foo',
                    parameters: [
                        {
                            kind: 'Var',
                            type: 'char',
                            name: 'b',
                            static: false,
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
