#include <stdio.h>
#define bool unsigned char
#define true 1
#define false 0

char coins[6] = {1, 5, 10, 25, 50, 100};
int total[101];

int change() {
    char i, j;

    total[0] = 1;
    for (i = 1; i <= 100; i += 1) {
        total[i] = 0;
    }
    for (i = 0; i < 6; i += 1) {
        for (j = coins[i]; j <= 100; j += 1) {
            total[j] += total[j - coins[i]];
        }
    }
    return total[100];
}
