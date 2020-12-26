int seed = 0xACE1;

char rand() {
    char bit, low;
    low = (char) seed;
    bit = ((low >> 0) ^ (low >> 2) ^ (low >> 3) ^ (low >> 5)) & 1;
    seed = (seed >> 1) | (bit ? 0x8000 : 0);
    return (char) seed;
}
