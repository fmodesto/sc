int array[2][3][3] = {
    {
        { 1, 2, 3 },
        { 4, 5, 6 },
        { 7, 8, 9 }
    },
    {
        { 11, 12, 13 },
        { 14, 15, 16 },
        { 17, 18, 19 }
    }
};

void test(char b, char c) {
    int a;
    a = array[1][1][2] + array[1][b+b][c];
}
/*
GET test_0:test_1,array,#$2C
ADD test_2,test_b,test_b
SHL test_2,test_2,#$03
SHL test_3,test_c,#$01
ADD test_3,test_2,test_3
GET test_2:test_3,array,test_3
ADD test_2:test_3,test_0:test_1,test_2:test_3
MOV test_a_H:test_a_L,test_2:test_3


GET test_0:test_1,array,#$2C
ADD test_2,test_b,test_b
SHL test_2,test_2,#$02
ADD test_2,test_2,test_c
SHL test_2,test_2,#$01
GET test_2:test_3,array,test_2
ADD test_2:test_3,test_0:test_1,test_2:test_3
MOV test_a_H:test_a_L,test_2:test_3

*/