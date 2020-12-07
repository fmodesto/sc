#define bool unsigned char
#define true 1
#define false 0

bool test = 0;

char mul8(char a, char b) {
    char res, flag, sign;
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

char div8(char a, char b) {
    char q, r, flag, sign;
    q = 0;
    r = 0;
    sign = 0;
    if (a < 0) {
        a = -a;
        sign = 1;
    }
    if (b < 0) {
        b = -b;
        sign ^= 1;
    }
    flag = 0x80;
    while (flag) {
        r <<= 1;
        if (flag & a) {
            r |= 1;
        }
        if (r >= b) {
            r -= b;
            q |= flag;
        }
        flag >>= 1;
    }
    return sign ? -q : q;
}

char mod8(char a, char b) {
    char q, r, flag, sign;
    q = 0;
    r = 0;
    sign = 0;
    if (a < 0) {
        a = -a;
        sign = 1;
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
        if (r >= b) {
            r -= b;
            q |= flag;
        }
        flag >>= 1;
    }
    return sign ? -r : r;
}

char shl8(char a, char b) {
    b &= 0x07;
    while (b) {
        a <<= 1;
        b -= 1;
    }
    return a;
}

char shr8(char a, char b) {
    b &= 0x07;
    while (b) {
        a >>= 1;
        b -= 1;
    }
    return a;
}
