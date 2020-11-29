#define byte unsigned char
#define bool unsigned char
#define true 1
#define false 0

bool test = 0;

byte multiply(byte a, byte b) {
    byte res, flag;
    res = 0;
    flag = 1;
    while (flag) {
        if (flag & b) {
            res += a;
        }
        a <<= 1;
        flag <<= 1;
    }
    return res;
}

byte divide(byte a, byte b) {
    byte q, r, flag;
    q = 0;
    r = 0;
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
    return q;
}

byte mod(byte a, byte b) {
    byte q, r, flag;
    q = 0;
    r = 0;
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
    return r;
}

byte shiftl(byte value, byte pos) {
    while (pos) {
        value <<= 1;
        pos -= 1;
    }
    return value;
}

byte shiftr(byte value, byte pos) {
    while (pos) {
        value >>= 1;
        pos -= 1;
    }
    return value;
}

byte main() {
    byte a, b;
    a=1;b=2;
    if (a) {
        shiftr(a, b);
    } else if (b) {
        a = 3;
    } else {
        b = 2;
    }
    a = 15;
    b = 1 <<6;
    return 0;
}
