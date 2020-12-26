import parseVm from '../src/parser.js';
import linkerVm from '../src/linker.js';

const link = (src, m) => linkerVm(parseVm(src), { m });

describe('Links requirements', () => {

    test('Simple program', (done) => {
        let src = `
            .FUNCTION foo
                .BYTE foo_return 0
                .BYTE foo_a 0
                .BYTE foo_b 0
                .CODE
                MUL foo_return,foo_a,foo_b
            .ENDFUNCTION foo
        `;

        expect(link(src, 'foo')).toEqual(expect.arrayContaining([
            '.org $000',
            'jsr foo',
            '_end_program_:',
            'jmp _end_program_',

            'mul8:',
            'ret mul8',

            'foo:',
            'ret foo',
        ]));
        done();
    });
});
