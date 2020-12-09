#define bool unsigned char
#define true 1
#define false 0

bool test = 0;

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

char div8(char a, char b) {
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
        sign ^= true;
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
        if (r >= b) {
            r -= b;
            q |= flag;
        }
        flag >>= 1;
    }
    return sign ? -q : q;
}

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
        if (r >= b) {
            r -= b;
            q |= flag;
        }
        flag >>= 1;
    }
    return sign ? -r : r;
}

int mod16(int a, int b) {
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

int shl16(int a, char b) {
    b &= 0x0F;
    while (b) {
        a <<= 1;
        b -= 1;
    }
    return (char) a;
}

char shr8(char a, char b) {
    b &= 0x07;
    while (b) {
        a >>= 1;
        b -= 1;
    }
    return a;
}

int shr16(int a, char b) {
    b &= 0x0F;
    while (b) {
        a >>= 1;
        b -= 1;
    }
    return a;
}
