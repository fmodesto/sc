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

int mul16(int a, int b) {
    int res, flag;
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

char div8(char a, char b) /*-{
    char q, r, flag;
    bool sign;

    lda div8_a
    xor div8_b
    jne div8_next_0
    lda #1
    sta div8_return
    jmp div8_end
div8_next_0:
    ldn
    sta div8_sign
    lda div8_a
    jge div8_next_1
    lda #0
    sub div8_a
    sta div8_a
div8_next_1:
    lda div8_b
    jge div8_next_2
    lda #0
    sub div8_b
    sta div8_b
    jge div8_next_2
    lda #0
    sta div8_return
    jmp div8_end
div8_next_2:
    lda #0
    sta div8_q
    sta div8_r
    lda #$80
    sta div8_flag
div8_while:
    jeq div8_end_while
    lda div8_r
    shl
    sta div8_r
    lda div8_flag
    and div8_a
    jeq div8_next_3
    lda div8_r
    ora #1
    sta div8_r
div8_next_3:
    lda div8_r
    sub div8_b
    jlt div8_next_4
    sta div8_r
    lda div8_q
    ora div8_flag
    sta div8_q
div8_next_4:
    lda div8_flag
    shr
    sta div8_flag
    jmp div8_while
div8_end_while:
    lda div8_q
    sta div8_return
    lda div8_sign
    jeq div8_end
    lda #0
    sub div8_return
    sta div8_return
div8_end:
}-*/;

int div16(int a, int b) /*-{
    int q, r, flag;
    bool sign;

    lda div16_a_H
    xor div16_b_H
    jne div16_label_0
    lda div16_a_L
    xor div16_b_L
    jne div16_label_0
    lda #0
    sta div16_return_H
    lda #1
    sta div16_return_L
    jmp div16_end
div16_label_0:
    lda div16_a_H
    xor div16_b_H
    ldn
    sta div16_sign
    lda div16_a_H
    jge div16_label_3
    lda #0
    sub div16_a_L
    sta div16_a_L
    jcs div16_label_1
    lda div16_a_H
    not
    jmp div16_label_2
div16_label_1:
    lda #0
    sub div16_a_H
div16_label_2:
    sta div16_a_H
div16_label_3:
    lda div16_b_H
    jge div16_label_6
    lda #0
    sub div16_b_L
    sta div16_b_L
    jcs div16_label_4
    lda div16_b_H
    not
    jmp div16_label_5
div16_label_4:
    lda #0
    sub div16_b_H
div16_label_5:
    sta div16_b_H
    jge div16_label_6
    lda #0
    sta div16_return_H
    sta div16_return_L
    jmp div16_end
div16_label_6:
    lda #0
    sta div16_q_H
    sta div16_q_L
    sta div16_r_H
    sta div16_r_L
    sta div16_flag_L
    lda #$80
    sta div16_flag_H
div16_while:
    lda div16_flag_H
    ora div16_flag_L
    jeq div16_end_while
    lda div16_r_L
    shl
    sta div16_r_L
    jcs div16_label_7
    lda div16_r_H
    shl
    jmp div16_label_8
div16_label_7:
    lda div16_r_H
    shl
    ora #1
div16_label_8:
    sta div16_r_H
    lda div16_flag_H
    and div16_a_H
    jne div16_label_9
    lda div16_flag_L
    and div16_a_L
    jeq div16_label_10
div16_label_9:
    lda div16_r_L
    ora #1
    sta div16_r_L
div16_label_10:
    lda div16_r_L
    sub div16_b_L
    sta _tmp_0
    jcs div16_label_11
    lda div16_b_H
    not
    add div16_r_H
    jmp div16_label_12
div16_label_11:
    lda div16_r_H
    sub div16_b_H
div16_label_12:
    jlt div16_label_13
    sta div16_r_H
    lda _tmp_0
    sta div16_r_L
    lda div16_q_H
    ora div16_flag_H
    sta div16_q_H
    lda div16_q_L
    ora div16_flag_L
    sta div16_q_L
div16_label_13:
    lda div16_flag_H
    shr
    sta div16_flag_H
    jcs div16_label_14
    lda div16_flag_L
    shr
    jmp enddiv16_label_14
div16_label_14:
    lda div16_flag_L
    shr
    ora #$80
enddiv16_label_14:
    sta div16_flag_L
    jmp div16_while
div16_end_while:
    lda div16_q_H
    sta div16_return_H
    lda div16_q_L
    sta div16_return_L
    lda div16_sign
    jeq div16_end
    lda #0
    sub div16_return_L
    sta div16_return_L
    jcs div16_label_15
    lda div16_return_H
    not
    jmp div16_label_16
div16_label_15:
    lda #0
    sub div16_return_H
div16_label_16:
    sta div16_return_H
}-*/;

char mod8(char a, char b) {
    char q, r, flag;
    bool sign;
    q = 0;
    r = 0;
    sign = false;
    if (a < 0) {
        a = -a;
        sign = true;
    }
    if (b < 0) {
        b = -b;
    }
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
    return sign ? -r : r;
}

int mod16(int a, int b) {
    int q, r, flag;
    bool sign;
    q = 0;
    r = 0;
    sign = false;
    if (a < 0) {
        a = -a;
        sign = true;
    }
    if (b < 0) {
        b = -b;
    }
    flag = 0x8000;
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
    return sign ? -r : r;
}
