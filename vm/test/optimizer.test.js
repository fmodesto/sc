import parseVm from '../src/parser.js';
import optimizeVm from '../src/optimizer.js';

const optimize = (src) => optimizeVm(parseVm(src));

describe('Optimizes vm code', () => {

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
                .LABEL multiply_label_0
                JZ multiply_label_1,multiply_flag
                AND multiply_0,multiply_flag,multiply_b
                JZ multiply_label_3,multiply_0
                ADD multiply_0,multiply_res,multiply_a
                MOV multiply_res,multiply_0
                .LABEL multiply_label_3
                SHL multiply_0,multiply_a,#1
                MOV multiply_a,multiply_0
                SHL multiply_0,multiply_flag,#1
                MOV multiply_flag,multiply_0
                JMP multiply_label_0
                .LABEL multiply_label_1
                MOV multiply_res,multiply_res
                MOV multiply_return,multiply_res
                JMP multiply_end
                .LABEL multiply_end
            .RETRUN multiply`;

        expect(optimize(src)).toEqual([
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
            ['.LABEL', 'multiply_label_0'],
            ['JZ', 'multiply_label_1', 'multiply_flag'],
            ['AND', 'multiply_0', 'multiply_flag', 'multiply_b'],
            ['JZ', 'multiply_label_3', 'multiply_0'],
            ['ADD', 'multiply_res', 'multiply_res', 'multiply_a'],
            ['.LABEL', 'multiply_label_3'],
            ['SHL', 'multiply_a', 'multiply_a', '#1'],
            ['SHL', 'multiply_flag', 'multiply_flag', '#1'],
            ['JMP', 'multiply_label_0'],
            ['.LABEL', 'multiply_label_1'],
            ['MOV', 'multiply_return', 'multiply_res'],
            ['.LABEL', 'multiply_end'],
            ['.RETRUN', 'multiply'],
        ]);
        done();
    });

    test('Casts byte', (done) => {
        let src =
            `.FUNCTION test
                .LOCALS
                .BYTE test_a 0
                .BYTE test_b_H 0
                .BYTE test_b_L 0
                .BYTE test_c 0
                .TMP
                .BYTE test_0 0
                .BYTE test_1 0
                .CODE
                MOV test_0,test_a
                MOV test_a,test_0
                MOV test_0,test_b_H:test_b_L
                MOV test_a,test_0
                MOV test_0,test_c
                MOV test_a,test_0
                JMP test_end
                .LABEL test_end
            .ENDFUNCTION test`;

        expect(optimize(src)).toEqual([
            ['.FUNCTION', 'test'],
            ['.LOCALS'],
            ['.BYTE', 'test_a', '0'],
            ['.BYTE', 'test_b_H', '0'],
            ['.BYTE', 'test_b_L', '0'],
            ['.BYTE', 'test_c', '0'],
            ['.TMP'],
            ['.CODE'],
            ['MOV', 'test_a', 'test_b_H:test_b_L'],
            ['MOV', 'test_a', 'test_c'],
            ['.LABEL', 'test_end'],
            ['.ENDFUNCTION', 'test'],
        ]);
        done();
    });

    test('Casts int', (done) => {
        let src =
            `.FUNCTION test
                .LOCALS
                .BYTE test_a 0
                .BYTE test_b_H 0
                .BYTE test_b_L 0
                .BYTE test_c 0
                .TMP
                .BYTE test_0 0
                .BYTE test_1 0
                .CODE
                MOV test_0:test_1,test_a
                MOV test_b_H:test_b_L,test_0:test_1
                MOV test_0:test_1,test_b_H:test_b_L
                MOV test_b_H:test_b_L,test_0:test_1
                MOV test_0:test_1,test_c
                MOV test_b_H:test_b_L,test_0:test_1
                JMP test_end
                .LABEL test_end
            .ENDFUNCTION test`;

        expect(optimize(src)).toEqual([
            ['.FUNCTION', 'test'],
            ['.LOCALS'],
            ['.BYTE', 'test_a', '0'],
            ['.BYTE', 'test_b_H', '0'],
            ['.BYTE', 'test_b_L', '0'],
            ['.BYTE', 'test_c', '0'],
            ['.TMP'],
            ['.CODE'],
            ['MOV', 'test_b_H:test_b_L', 'test_a'],
            ['MOV', 'test_b_H:test_b_L', 'test_c'],
            ['.LABEL', 'test_end'],
            ['.ENDFUNCTION', 'test'],
        ]);
        done();
    });

    test('Casts boolean', (done) => {
        let src =
            `.FUNCTION test
                .LOCALS
                .BYTE test_a 0
                .BYTE test_b_H 0
                .BYTE test_b_L 0
                .BYTE test_c 0
                .TMP
                .BYTE test_0 0
                .BYTE test_1 0
                .CODE
                BOOL test_1,test_a
                MOV test_c,test_1
                BOOL test_1,test_b_H:test_b_L
                MOV test_c,test_1
                MOV test_1,test_c
                MOV test_c,test_1
                JMP test_end
                .LABEL test_end
            .ENDFUNCTION test`;

        expect(optimize(src)).toEqual([
            ['.FUNCTION', 'test'],
            ['.LOCALS'],
            ['.BYTE', 'test_a', '0'],
            ['.BYTE', 'test_b_H', '0'],
            ['.BYTE', 'test_b_L', '0'],
            ['.BYTE', 'test_c', '0'],
            ['.TMP'],
            ['.CODE'],
            ['BOOL', 'test_c', 'test_a'],
            ['BOOL', 'test_c', 'test_b_H:test_b_L'],
            ['.LABEL', 'test_end'],
            ['.ENDFUNCTION', 'test'],
        ]);
        done();
    });

    test('Casts return', (done) => {
        let src =
            `.FUNCTION test
                .BYTE test_return_H 0
                .BYTE test_return_L 0
                .LOCALS
                .BYTE test_a 0
                .BYTE test_b_H 0
                .BYTE test_b_L 0
                .TMP
                .BYTE test_0 0
                .BYTE test_1 0
                .CODE
                SHR test_0:test_1,test_b_H:test_b_L,test_a
                MOV test_1,test_0:test_1
                CAST test_return_H:test_return_L,test_1
                JMP test_end
                .LABEL test_end
            .ENDFUNCTION test`;

        expect(optimize(src)).toEqual([
            ['.FUNCTION', 'test'],
            ['.BYTE', 'test_return_H', '0'],
            ['.BYTE', 'test_return_L', '0'],
            ['.LOCALS'],
            ['.BYTE', 'test_a', '0'],
            ['.BYTE', 'test_b_H', '0'],
            ['.BYTE', 'test_b_L', '0'],
            ['.TMP'],
            ['.BYTE', 'test_1', '0'],
            ['.CODE'],
            ['SHR', 'test_1', 'test_b_H:test_b_L', 'test_a'],
            ['CAST', 'test_return_H:test_return_L', 'test_1'],
            ['.LABEL', 'test_end'],
            ['.ENDFUNCTION', 'test'],
        ]);
        done();
    });
});
