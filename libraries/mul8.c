#define bool unsigned char
#define true 1
#define false 0

char mul8(char a, char b) {
    char res, flag;
    flag = 1;
    res = 0;
    while (flag) {
        if (flag & b) {
            res += a;
        }
        a <<= 1;
        flag <<= 1;
    }
    return res;
}
