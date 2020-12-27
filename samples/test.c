#define bool unsigned char
#define true 1
#define false 0

bool array[10] = { 1, 0, 1, 0, 1, 0, 1, 0, 1, 0 };
void test() {
    array[0] = true;
    array[7] = 0;
    array[9] = array[3];
    array[(char) array[4]] ^= array[8];
}
