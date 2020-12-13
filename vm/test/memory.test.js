import parseVm from '../src/parser.js';
import memoryVm from '../src/memory.js';

const memory = (src) => memoryVm(parseVm(src)).memory;

describe('Handles memory', () => {

    test('Simple program', (done) => {
        let src = `
            .BYTE a 24
            .BYTE b 240

            .FUNCTION goo
                .BYTE goo_return 0
                .BYTE goo_a 0
                .BYTE goo_b 0
                .BYTE goo_c 0
                .BYTE goo_d 0
                .CODE
            .RETRUN goo

            .FUNCTION baz
                .BYTE baz_return 0
                .BYTE baz_a 0
                .CODE
            .RETRUN baz

            .FUNCTION bar
                .BYTE bar_return 0
                .BYTE bar_a 0
                CALL baz
                .CODE
            .RETRUN bar

            .FUNCTION foo
                .BYTE foo_return 0
                .BYTE foo_a 0
                .BYTE foo_b 0
                .CODE
                CALL bar
                CALL goo
            .RETRUN foo
        `;

        expect(memory(src)).toEqual([
            'a:',
            '.byte 24',
            'b:',
            '.byte 240',
            'goo_return:',
            'baz_return:',
            '.byte 0',
            'goo_a:',
            'baz_a:',
            '.byte 0',
            'goo_b:',
            'bar_return:',
            '.byte 0',
            'goo_c:',
            'bar_a:',
            '.byte 0',
            'goo_d:',
            '.byte 0',
            'foo_return:',
            '.byte 0',
            'foo_a:',
            '.byte 0',
            'foo_b:',
            '.byte 0',
        ]);
        done();
    });

    test('Error if loop', (done) => {
        let src = `
            .FUNCTION foo
                .CODE
                CALL bar
            .RETRUN foo

            .FUNCTION bar
                .CODE
                CALL foo
            .RETRUN bar
        `;

        expect(() => memory(src)).toThrow('Recursion detected');
        done();
    });
});
