#define byte unsigned char
#define bool unsigned char
#include <stdio.h>

byte ga = 6;
byte gb = 3;

byte gcd(byte a, byte b) {
    byte c;
    while (a) {
        c = b % a;
        b = a;
        a = c;
    }
    return b;
}

byte max(byte a, byte b) {
    return a > b ? a : b;
}

byte lcm(byte a, byte b) {
    return a / gcd(a, b) * b;
}

void main() {
    gcd(15, 29);
    lcm(max(7, 40), 49);
}
