import parseVm from '../src/parser.js';
import memoryVm from '../src/memory.js';

const memory = (src) => memoryVm(parseVm(src));

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
                .STATIC
                .BYTE goo_d 0
                .CODE
            .ENDFUNCTION goo

            .FUNCTION baz
                .BYTE baz_return 0
                .BYTE baz_a 0
                .CODE
            .ENDFUNCTION baz

            .FUNCTION bar
                .BYTE bar_return 0
                .BYTE bar_a 0
                CALL baz
                .CODE
            .ENDFUNCTION bar

            .FUNCTION foo
                .BYTE foo_return 0
                .BYTE foo_a 0
                .BYTE foo_b 0
                .CODE
                CALL bar
                CALL goo
            .ENDFUNCTION foo
        `;

        expect(memory(src)).toEqual([
            '.data',
            'a:',
            '.byte 24',
            '.data',
            'b:',
            '.byte 240',
            '.data',
            'goo_d:',
            '.byte 0',
            '.data',
            'goo_return:',
            'baz_return:',
            '.byte 0',
            '.data',
            'goo_a:',
            'baz_a:',
            '.byte 0',
            '.data',
            'goo_b:',
            'bar_return:',
            '.byte 0',
            '.data',
            'goo_c:',
            'bar_a:',
            '.byte 0',
            '.data',
            'foo_return:',
            '.byte 0',
            '.data',
            'foo_a:',
            '.byte 0',
            '.data',
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
            .ENDFUNCTION foo

            .FUNCTION bar
                .CODE
                CALL foo
            .ENDFUNCTION bar
        `;

        expect(() => memory(src)).toThrow('Recursion detected');
        done();
    });
});
