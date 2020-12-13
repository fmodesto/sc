#define bool unsigned char
#define true 1
#define false 0

char mod8(char a, char b) {
    char q, r, flag;
    bool sign;
    q = 0;
    r = 0;
    sign = false;
    if (a < 0) {
        a = -a;
        sign = true;
    }
    if (b < 0) {
        b = -b;
    }
    flag = 0x80;
    while (flag) {
        r <<= 1;
        if (flag & a) {
            r |= 1;
        }
        if (r - b >= 0) {
            r -= b;
            q |= flag;
        }
        flag >>= 1;
    }
    return sign ? -r : r;
}
