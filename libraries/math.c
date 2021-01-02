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

short mul16(short a, short b) {
    short res, flag;
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
    char q, r;
    unsigned char flag;
    bool sign;

    if (a == b) { return 1; }
    sign = (a ^ b) < 0;
    a = a < 0 ? -a : a;
    b = b < 0 ? -b : b;
    if (b < 0) { return 0; }

    q = 0;
    r = 0;
    flag = 0x80;
    while (flag) {
        r <<= 1;
        if (flag & a) {
            r |= 1;
        }
        if (r < 0 || r - b >= 0) {
            r -= b;
            q |= flag;
        }
        flag >>= 1;
    }
    return sign ? -q : q;
}

short div16(short a, short b) {
    short q, r;
    unsigned short flag;
    bool sign;

    if (a == b) { return 1; }
    sign = (a ^ b) < 0;
    a = a < 0 ? -a : a;
    b = b < 0 ? -b : b;
    if (b < 0) { return 0; }

    q = 0;
    r = 0;
    flag = 0x8000;
    while (flag) {
        r <<= 1;
        if (flag & a) {
            r |= 1;
        }
        if (r < 0 || r - b >= 0) {
            r -= b;
            q |= flag;
        }
        flag >>= 1;
    }
    return sign ? -q : q;
}

char mod8(char a, char b) {
    char q, r;
    unsigned char flag;
    bool sign;

    if (a == b) { return 0; }
    sign = a < 0;
    b = b < 0 ? -b : b;
    if (b < 0) { return a; }
    a = a < 0 ? -a : a;

    q = 0;
    r = 0;
    flag = 0x80;
    while (flag) {
        r <<= 1;
        if (flag & a) {
            r |= 1;
        }
        if (r < 0 || r - b >= 0) {
            r -= b;
            q |= flag;
        }
        flag >>= 1;
    }
    return sign ? -r : r;
}

short mod16(short a, short b) {
    short q, r;
    unsigned short flag;
    bool sign;

    if (a == b) { return 0; }
    sign = a < 0;
    b = b < 0 ? -b : b;
    if (b < 0) { return a; }
    a = a < 0 ? -a : a;

    q = 0;
    r = 0;
    flag = 0x8000;
    while (flag) {
        r <<= 1;
        if (flag & a) {
            r |= 1;
        }
        if (r < 0 || r - b >= 0) {
            r -= b;
            q |= flag;
        }
        flag >>= 1;
    }
    return sign ? -r : r;
}

#ifndef _TEST_
#include <stdio.h>

int main() {
    int i, j;
    printf("mul8  ");
    for (i = 0; i < 256; i++) {
        if (i % 4 == 0) {
            printf(".");
            fflush(stdout);
        }
        for (j = 0; j < 256; j++) {
            char expected = (char) i * (char) j;
            char actual = mul8((char) i, (char) j);
            if (expected != actual) {
                printf("Error in mul8(%d, %d) Expected: %d. Found %d\n", (char) i, (char) j, expected, actual);
            }
        }
    }

    printf("\nmul16 ");
    for (i = 0; i < (1<<16); i++) {
        if (i % 1024 == 0) {
            printf(".");
            fflush(stdout);
        }
        for (j = 0; j < (1<<16); j++) {
            char expected = (short) i * (short) j;
            char actual = mul16((short) i, (short) j);
            if (expected != actual) {
                printf("Error in mul16(%d, %d) Expected: %d. Found %d\n", (short) i, (short) j, expected, actual);
            }
        }
    }

    printf("\ndiv8  ");
    for (i = 0; i < 256; i++) {
        if (i % 4 == 0) {
            printf(".");
            fflush(stdout);
        }
        for (j = 1; j < 256; j++) {
            char expected = (char) i / (char) j;
            char actual = div8((char) i, (char) j);
            if (expected != actual) {
                printf("Error in div8(%d, %d) Expected: %d. Found %d\n", (char) i, (char) j, expected, actual);
            }
        }
    }

    printf("\ndiv16 ");
    for (i = 0; i < (1<<16); i++) {
        if (i % 1024 == 0) {
            printf(".");
            fflush(stdout);
        }
        for (j = 1; j < (1<<16); j++) {
            char expected = (short) i / (short) j;
            char actual = div16((short) i, (short) j);
            if (expected != actual) {
                printf("Error in div16(%d, %d) Expected: %d. Found %d\n", (short) i, (short) j, expected, actual);
            }
        }
    }

    printf("\nmod8  ");
    for (i = 0; i < 256; i++) {
        if (i % 4 == 0) {
            printf(".");
            fflush(stdout);
        }
        for (j = 1; j < 256; j++) {
            char expected = (char) i % (char) j;
            char actual = mod8((char) i, (char) j);
            if (expected != actual) {
                printf("Error in mod8(%d, %d) Expected: %d. Found %d\n", (char) i, (char) j, expected, actual);
            }
        }
    }

    printf("\nmod16 ");
    for (i = 0; i < (1<<16); i++) {
        if (i % 1024 == 0) {
            printf(".");
            fflush(stdout);
        }
        for (j = 1; j < (1<<16); j++) {
            char expected = (short) i % (short) j;
            char actual = mod16((short) i, (short) j);
            if (expected != actual) {
                printf("Error in mod16(%d, %d) Expected: %d. Found %d\n", (short) i, (short) j, expected, actual);
            }
        }
    }

    printf("\n");
}

#endif