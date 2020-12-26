#define bool unsigned char
#define true 1
#define false 0

int pieces[7][4] = {
    {0x6600, 0x6600, 0x6600, 0x6600},
    {0x0F00, 0x2222, 0x00F0, 0x4444},
    {0x4E00, 0x4640, 0x0E40, 0x4C40},
    {0xC600, 0x2640, 0x0C60, 0x4C80},
    {0x6C00, 0x4620, 0x06C0, 0x8C40},
    {0x2E00, 0x4460, 0x0E80, 0xC440},
    {0x8E00, 0x6440, 0x0E20, 0x44C0}};

int mask[4][4] = {
    {0x8000, 0x4000, 0x2000, 0x1000},
    {0x0800, 0x0400, 0x0200, 0x0100},
    {0x0080, 0x0040, 0x0020, 0x0010},
    {0x0008, 0x0004, 0x0002, 0x0001}};

bool board[21][12];

char screen[32][8];

char x;
char y;
char piece;
char next;
char rotation;
char speed;

char rand();
void delay(int ms);

void initBoard() {
    char i, j;
    for (j = 0; j < 20; j += 1) {
        board[j][0] = true;
        board[j][11] = true;
        for (i = 1; i <= 10; i += 1) {
            board[j][i] = false;
        }
    }
    for (i = 0; i < 12; i += 1) {
        board[20][i] = true;
    }
}

void nextPiece() {
    piece = next;
    rotation = 0;
    do {
        next = rand() & 0x07;
    } while (next == 7);
}

void main() {
    initBoard();
    nextPiece();
    nextPiece();
    while (true) {
    }
}
