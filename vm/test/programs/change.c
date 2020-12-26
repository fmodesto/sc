char coins[6] = {1, 5, 10, 25, 50, 100};
int total[128];

int change(char amount) {
    char i, j;

    total[0] = 1;
    for (i = 1; i < 128; i += 1) {
        total[i] = 0;
    }
    for (i = 0; i < 6; i += 1) {
        for (j = coins[i]; j < 128; j += 1) {
            total[j] += total[j - coins[i]];
        }
    }
    return total[amount];
}
