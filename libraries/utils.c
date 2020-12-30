void delay(int ms) /*-{
    char counter;

    jmp delay_check
delay_outer:
    lda #189
    sta delay_counter
delay_inner:
    nop
    nop
    nop
    lda delay_counter
    sub #1
    sta delay_counter
    jne delay_inner
    nop
    lda delay_ms_L
    sub #1
    sta delay_ms_L
    jcs delay_check
    lda delay_ms_H
    sub #1
    sta delay_ms_H
delay_check:
    lda delay_ms_H
    ora delay_ms_L
    jne delay_outer
}-*/;

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
