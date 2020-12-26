.org $000
jsr main
_end_program_:
jmp _end_program_
rand_seed_H:
.byte $AC
rand_seed_L:
.byte $E1
rand_return:
main_a_H:
.byte 0
rand_bit_H:
main_a_L:
.byte 0
rand_bit_L:
.byte 0
rand_bit:
.byte 0
rand_temp:
.byte 0
rand:
lda #0
sta rand_bit_H
sta rand_bit_L
lda rand_seed_L
sta rand_bit
shr
shr
sta rand_temp
xor rand_bit
sta rand_bit
lda rand_temp
shr
sta rand_temp
xor rand_bit
sta rand_bit
lda rand_temp
shr
shr
xor rand_bit
shr
jnc rand_shift_1
lda #$80
sta rand_bit_H
rand_shift_1:
lda rand_seed_H
shr
jnc rand_shift_2
lda #$80
sta rand_bit_L
rand_shift_2:
lda rand_seed_H
shr
ora rand_bit_H
sta rand_seed_H
lda rand_seed_L
shr
ora rand_bit_L
sta rand_seed_L
sta rand_return
ret rand
main:
main_end:
ret main
