#define reg(x)

reg(0xFFE)
int screen;

int sqrt(int x) {
    int left, right, mid, res;
    if (x < 2) {
        return x;
    }

    left = 0;
    right = 181;
    res = 0;
    while (left <= right) {
        mid = (left + right) >> 1;

        if (mid * mid <= x) {
            left = mid + 1;
            res = mid;
        } else {
            right = mid - 1;
        }
    }
    return res;
}

void main() {
    int i, j;
    i = 1;
    while (i) {
        // screen = i;
        j = sqrt(i);
        screen = j;
        // screen = i - j * j;
        // screen = 0;
        i += 1;
    }
}
