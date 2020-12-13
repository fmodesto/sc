#define bool unsigned char
#define true 1
#define false 0

int div16(int a, int b) {
    int q, r, flag;
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
        sign ^= true;
    }
    flag = 0x8000;
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
    return sign ? -q : q;
}