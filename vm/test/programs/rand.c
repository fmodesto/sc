char rand() /*-{
    static int seed = 0xACE1;
    char bit;

    lda #0
    sta _tmp_1
    lda rand_seed_L
    sta rand_bit
    shr
    shr
    sta _tmp_0
    xor rand_bit
    sta rand_bit
    lda _tmp_0
    shr
    sta _tmp_0
    xor rand_bit
    sta rand_bit
    lda _tmp_0
    shr
    shr
    xor rand_bit
    shr
    jnc rand_shift_1
    lda #$80
    sta _tmp_1
rand_shift_1:
    lda #0
    sta _tmp_0
    lda rand_seed_H
    shr
    jnc rand_shift_2
    lda #$80
    sta _tmp_0
rand_shift_2:
    lda rand_seed_H
    shr
    ora _tmp_1
    sta rand_seed_H
    lda rand_seed_L
    shr
    ora _tmp_0
    sta rand_seed_L
    sta rand_return
}-*/;
