.org $000
jsr main
_end_program_:
jmp _end_program_
rand_seed_H:
.byte $AC
rand_seed_L:
.byte $E1
x:
.byte $00
y:
.byte $00
piece:
.byte $00
next:
.byte $00
rotation:
.byte $00
speed:
.byte $00
rand_return:
delay_ms_H:
initBoard_i:
.byte 0
rand_bit_H:
delay_ms_L:
initBoard_j:
.byte 0
rand_bit_L:
delay_counter:
initBoard_0:
.byte 0
rand_bit:
initBoard_1:
.byte 0
rand_temp:
initBoard_2:
.byte 0
nextPiece_0:
.byte $00
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
delay:
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
ret delay
initBoard:
lda #$00
sta initBoard_j
initBoard_vm_2:
lda initBoard_j
xor #$14
jlt initBoard_asm_0
lda initBoard_j
sub #$14
jlt initBoard_asm_1
lda #0
jmp initBoard_asm_2
initBoard_asm_0:
lda initBoard_j
jlt initBoard_asm_1
lda #0
jmp initBoard_asm_2
initBoard_asm_1:
lda #1
initBoard_asm_2:
sta initBoard_2
lda initBoard_2
jeq initBoard_vm_3
lda initBoard_j
shl
sta initBoard_0
lda initBoard_0
sta initBoard_asm_3+1
initBoard_asm_3:
lda board
sta initBoard_1
lda initBoard_1
ora #$01
sta initBoard_1
lda initBoard_0
sta initBoard_asm_4+1
lda initBoard_1
initBoard_asm_4:
sta board
lda initBoard_j
shl
sta initBoard_0
lda #$01
add initBoard_0
sta initBoard_0
lda initBoard_0
sta initBoard_asm_5+1
initBoard_asm_5:
lda board
sta initBoard_1
lda initBoard_1
ora #$08
sta initBoard_1
lda initBoard_0
sta initBoard_asm_6+1
lda initBoard_1
initBoard_asm_6:
sta board
lda #$01
sta initBoard_i
initBoard_vm_0:
lda initBoard_i
xor #$0A
jeq initBoard_asm_8
jlt initBoard_asm_7
lda initBoard_i
sub #$0A
jlt initBoard_asm_8
lda #0
jmp initBoard_asm_9
initBoard_asm_7:
lda initBoard_i
jlt initBoard_asm_8
lda #0
jmp initBoard_asm_9
initBoard_asm_8:
lda #1
initBoard_asm_9:
sta initBoard_2
lda initBoard_2
jeq initBoard_vm_1
lda initBoard_j
shl
sta initBoard_0
lda #$01
sta initBoard_1
lda initBoard_i
and #$07
sta tmp_0
jeq initBoard_asm_11
initBoard_asm_10:
lda initBoard_1
shl
sta initBoard_1
lda tmp_0
sub #1
sta tmp_0
jne initBoard_asm_10
initBoard_asm_11:
lda initBoard_i
shr
shr
shr
sta initBoard_2
lda initBoard_2
add initBoard_0
sta initBoard_2
lda initBoard_2
sta initBoard_asm_12+1
initBoard_asm_12:
lda board
sta initBoard_0
lda initBoard_1
xor #255
sta initBoard_1
lda initBoard_1
and initBoard_0
sta initBoard_0
lda initBoard_2
sta initBoard_asm_13+1
lda initBoard_0
initBoard_asm_13:
sta board
lda #$01
add initBoard_i
sta initBoard_i
jmp initBoard_vm_0
initBoard_vm_1:
lda #$01
add initBoard_j
sta initBoard_j
jmp initBoard_vm_2
initBoard_vm_3:
lda #$00
sta initBoard_i
initBoard_vm_4:
lda initBoard_i
xor #$0C
jlt initBoard_asm_14
lda initBoard_i
sub #$0C
jlt initBoard_asm_15
lda #0
jmp initBoard_asm_16
initBoard_asm_14:
lda initBoard_i
jlt initBoard_asm_15
lda #0
jmp initBoard_asm_16
initBoard_asm_15:
lda #1
initBoard_asm_16:
sta initBoard_0
lda initBoard_0
jeq initBoard_vm_5
lda #$01
sta initBoard_2
lda initBoard_i
and #$07
sta tmp_0
jeq initBoard_asm_18
initBoard_asm_17:
lda initBoard_2
shl
sta initBoard_2
lda tmp_0
sub #1
sta tmp_0
jne initBoard_asm_17
initBoard_asm_18:
lda initBoard_i
shr
shr
shr
sta initBoard_0
lda initBoard_0
add #$28
sta initBoard_0
lda initBoard_0
sta initBoard_asm_19+1
initBoard_asm_19:
lda board
sta initBoard_1
lda initBoard_1
ora initBoard_2
sta initBoard_1
lda initBoard_0
sta initBoard_asm_20+1
lda initBoard_1
initBoard_asm_20:
sta board
lda #$01
add initBoard_i
sta initBoard_i
jmp initBoard_vm_4
initBoard_vm_5:
initBoard_end:
ret initBoard
nextPiece:
lda next
sta piece
lda #$00
sta rotation
nextPiece_vm_0:
jsr rand
lda rand_return
sta nextPiece_0
lda #$07
and nextPiece_0
sta next
lda #$07
sub next
jeq nextPiece_asm_0
lda #255
nextPiece_asm_0:
add #1
sta nextPiece_0
lda nextPiece_0
jne nextPiece_vm_0
nextPiece_end:
ret nextPiece
main:
jsr initBoard
jsr nextPiece
jsr nextPiece
main_vm_0:
jmp main_vm_0
main_end:
ret main
