int fib(char n) {
    char i;
    int f0, f1, f2;
    f2 = 0;
    f1 = 1;
    f0 = 1;
    for (i = 2; i <= n ; i += 1) {
        f0 = f1 + f2;
        f2 = f1;
        f1 = f0;
    }
    return n < 2 ? n : f0;
}
