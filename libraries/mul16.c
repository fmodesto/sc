#define bool unsigned char
#define true 1
#define false 0

int mul16(int a, int b) {
    int res, flag;
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
