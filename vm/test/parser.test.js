import parseVm from '../src/parser.js';

const parse = (src) => parseVm(src).map((e) => e.instruction);

describe('Parses vm code', () => {

    test('Simple program', (done) => {
        let src =
            `.FUNCTION multiply
                .BYTE multiply_return 0
                .BYTE multiply_a 0
                .BYTE multiply_b 0
                .LOCALS
                .BYTE multiply_res 0
                .BYTE multiply_flag 0
                .TMP
                .BYTE multiply_0 0
                .CODE
                MOV multiply_res,#0
                MOV multiply_flag,#1
                multiply_label_0:
                JZ multiply_label_1,multiply_flag
                AND multiply_0,multiply_flag,multiply_b
                JZ multiply_label_3,multiply_0
                ADD multiply_0,multiply_res,multiply_a
                MOV multiply_res,multiply_0
                multiply_label_3:
                SHL multiply_0,multiply_a,#1
                MOV multiply_a,multiply_0
                SHL multiply_0,multiply_flag,#1
                MOV multiply_flag,multiply_0
                JMP multiply_label_0
                multiply_label_1:
                MOV multiply_return,multiply_res
                JMP multiply_end
                multiply_end:
            .RETRUN multiply`;

        expect(parse(src)).toEqual([
            ['.FUNCTION', 'multiply'],
            ['.BYTE', 'multiply_return', '0'],
            ['.BYTE', 'multiply_a', '0'],
            ['.BYTE', 'multiply_b', '0'],
            ['.LOCALS'],
            ['.BYTE', 'multiply_res', '0'],
            ['.BYTE', 'multiply_flag', '0'],
            ['.TMP'],
            ['.BYTE', 'multiply_0', '0'],
            ['.CODE'],
            ['MOV', 'multiply_res', '#0'],
            ['MOV', 'multiply_flag', '#1'],
            ['multiply_label_0:'],
            ['JZ', 'multiply_label_1', 'multiply_flag'],
            ['AND', 'multiply_0', 'multiply_flag', 'multiply_b'],
            ['JZ', 'multiply_label_3', 'multiply_0'],
            ['ADD', 'multiply_0', 'multiply_res', 'multiply_a'],
            ['MOV', 'multiply_res', 'multiply_0'],
            ['multiply_label_3:'],
            ['SHL', 'multiply_0', 'multiply_a', '#1'],
            ['MOV', 'multiply_a', 'multiply_0'],
            ['SHL', 'multiply_0', 'multiply_flag', '#1'],
            ['MOV', 'multiply_flag', 'multiply_0'],
            ['JMP', 'multiply_label_0'],
            ['multiply_label_1:'],
            ['MOV', 'multiply_return', 'multiply_res'],
            ['JMP', 'multiply_end'],
            ['multiply_end:'],
            ['.RETRUN', 'multiply'],
        ]);
        done();
    });
});
