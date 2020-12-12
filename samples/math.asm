mul8_return:
mul16_return_H:
div8_return:
div16_return_H:
mod8_return:
mod16_return_H:
.byte 0
mul8_a:
mul16_return_L:
div8_a:
div16_return_L:
mod8_a:
mod16_return_L:
.byte 0
mul8_b:
mul16_a_H:
div8_b:
div16_a_H:
mod8_b:
mod16_a_H:
.byte 0
mul8_res:
mul16_a_L:
div8_q:
div16_a_L:
mod8_q:
mod16_a_L:
.byte 0
mul8_flag:
mul16_b_H:
div8_r:
div16_b_H:
mod8_r:
mod16_b_H:
.byte 0
mul8_0:
mul16_b_L:
div8_flag:
div16_b_L:
mod8_flag:
mod16_b_L:
.byte 0
mul16_res_H:
div8_sign:
div16_q_H:
mod8_sign:
mod16_q_H:
.byte 0
mul16_res_L:
div8_0:
div16_q_L:
mod8_0:
mod16_q_L:
.byte 0
mul16_flag_H:
div16_r_H:
mod16_r_H:
.byte 0
mul16_flag_L:
div16_r_L:
mod16_r_L:
.byte 0
mul16_0:
div16_flag_H:
mod16_flag_H:
.byte 0
mul16_1:
div16_flag_L:
mod16_flag_L:
.byte 0
div16_sign:
mod16_sign:
.byte 0
div16_0:
mod16_0:
.byte 0
div16_1:
mod16_1:
.byte 0
mul8:
lda #$01
sta mul8_flag
lda #$00
sta mul8_res
mul8_vm_0:
lda mul8_flag
jeq mul8_vm_1
lda mul8_b
and mul8_flag
sta mul8_0
lda mul8_0
jeq mul8_vm_3
lda mul8_a
add mul8_res
sta mul8_res
mul8_vm_3:
lda mul8_a
shl
sta mul8_a
lda mul8_flag
shl
sta mul8_flag
jmp mul8_vm_0
mul8_vm_1:
lda mul8_res
sta mul8_return
mul8_end:
ret mul8
mul16:
lda #$01
sta mul16_flag_L
jlt mul16_asm_0
lda #0
jmp mul16_asm_1
mul16_asm_0:
lda #FF
mul16_asm_1:
sta mul16_flag_H
lda #$00
sta mul16_res_L
jlt mul16_asm_2
lda #0
jmp mul16_asm_3
mul16_asm_2:
lda #FF
mul16_asm_3:
sta mul16_res_H
mul16_vm_0:
lda mul16_flag_L
ora mul16_flag_H
jeq mul16_vm_1
lda mul16_b_L
and mul16_flag_L
sta mul16_1
lda mul16_b_H
and mul16_flag_H
sta mul16_0
lda mul16_1
ora mul16_0
jeq mul16_vm_3
lda mul16_a_L
add mul16_res_L
sta mul16_res_L
jcs mul16_asm_4
lda mul16_a_H
jmp mul16_asm_5
mul16_asm_4:
lda mul16_a_H
add #1
mul16_asm_5:
add mul16_res_H
sta mul16_res_H
mul16_vm_3:
lda mul16_a_L
shl
sta mul16_a_L
jcs mul16_asm_6
lda mul16_a_H
shl
jmp mul16_asm_7
mul16_asm_6:
lda mul16_a_H
shl
ora #1
mul16_asm_7:
sta mul16_a_H
lda mul16_flag_L
shl
sta mul16_flag_L
jcs mul16_asm_8
lda mul16_flag_H
shl
jmp mul16_asm_9
mul16_asm_8:
lda mul16_flag_H
shl
ora #1
mul16_asm_9:
sta mul16_flag_H
jmp mul16_vm_0
mul16_vm_1:
lda mul16_res_L
sta mul16_return_L
lda mul16_res_H
sta mul16_return_H
mul16_end:
ret mul16
div8:
lda #$00
sta div8_q
lda #$00
sta div8_r
lda #$00
sta div8_sign
lda div8_a
jlt div8_asm_0
lda #0
jmp div8_asm_1
div8_asm_0:
lda #1
div8_asm_1:
sta div8_0
lda div8_0
jeq div8_vm_1
lda #0
sub div8_a
sta div8_a
lda #$01
sta div8_sign
div8_vm_1:
lda div8_b
jlt div8_asm_2
lda #0
jmp div8_asm_3
div8_asm_2:
lda #1
div8_asm_3:
sta div8_0
lda div8_0
jeq div8_vm_3
lda #0
sub div8_b
sta div8_b
lda #$01
xor div8_sign
sta div8_sign
div8_vm_3:
lda #$80
sta div8_flag
div8_vm_4:
lda div8_flag
jeq div8_vm_5
lda div8_r
shl
sta div8_r
lda div8_a
and div8_flag
sta div8_0
lda div8_0
jeq div8_vm_7
lda #$01
ora div8_r
sta div8_r
div8_vm_7:
lda div8_r
xor div8_b
jlt div8_asm_4
lda div8_r
sub div8_b
jge div8_asm_5
lda #0
jmp div8_asm_6
div8_asm_4:
lda div8_r
jge div8_asm_5
lda #0
jmp div8_asm_6
div8_asm_5:
lda #1
div8_asm_6:
sta div8_0
lda div8_0
jeq div8_vm_9
lda div8_r
sub div8_b
sta div8_r
lda div8_flag
ora div8_q
sta div8_q
div8_vm_9:
lda div8_flag
shr
sta div8_flag
jmp div8_vm_4
div8_vm_5:
lda div8_sign
jeq div8_vm_10
lda #0
sub div8_q
sta div8_0
jmp div8_vm_11
div8_vm_10:
lda div8_q
sta div8_0
div8_vm_11:
lda div8_0
sta div8_return
div8_end:
ret div8
div16:
lda #$00
sta div16_q_L
jlt div16_asm_0
lda #0
jmp div16_asm_1
div16_asm_0:
lda #FF
div16_asm_1:
sta div16_q_H
lda #$00
sta div16_r_L
jlt div16_asm_2
lda #0
jmp div16_asm_3
div16_asm_2:
lda #FF
div16_asm_3:
sta div16_r_H
lda #$00
sta div16_sign
lda #$00
sta div16_1
jlt div16_asm_4
lda #0
jmp div16_asm_5
div16_asm_4:
lda #FF
div16_asm_5:
sta div16_0
lda div16_a_L
xor div16_1
jlt div16_asm_6
lda div16_a_L
sub div16_1
jlt div16_asm_7
lda #0
jmp div16_asm_8
div16_asm_6:
lda div16_a_L
jlt div16_asm_7
lda #0
jmp div16_asm_8
div16_asm_7:
lda #1
div16_asm_8:
sta div16_1
lda div16_1
jeq div16_vm_1
lda #0
sub div16_a_L
sta div16_a_L
jcs div16_asm_9
lda div16_a_H
xor #$FF
jmp div16_asm_10
div16_asm_9:
lda #0
sub div16_a_H
div16_asm_10:
sta div16_a_H
lda #$01
sta div16_sign
div16_vm_1:
lda #$00
sta div16_1
jlt div16_asm_11
lda #0
jmp div16_asm_12
div16_asm_11:
lda #FF
div16_asm_12:
sta div16_0
lda div16_b_L
xor div16_1
jlt div16_asm_13
lda div16_b_L
sub div16_1
jlt div16_asm_14
lda #0
jmp div16_asm_15
div16_asm_13:
lda div16_b_L
jlt div16_asm_14
lda #0
jmp div16_asm_15
div16_asm_14:
lda #1
div16_asm_15:
sta div16_1
lda div16_1
jeq div16_vm_3
lda #0
sub div16_b_L
sta div16_b_L
jcs div16_asm_16
lda div16_b_H
xor #$FF
jmp div16_asm_17
div16_asm_16:
lda #0
sub div16_b_H
div16_asm_17:
sta div16_b_H
lda #$01
xor div16_sign
sta div16_sign
div16_vm_3:
lda #$00
sta div16_flag_L
lda #$80
sta div16_flag_H
div16_vm_4:
lda div16_flag_L
ora div16_flag_H
jeq div16_vm_5
lda div16_r_L
shl
sta div16_r_L
jcs div16_asm_18
lda div16_r_H
shl
jmp div16_asm_19
div16_asm_18:
lda div16_r_H
shl
ora #1
div16_asm_19:
sta div16_r_H
lda div16_a_L
and div16_flag_L
sta div16_1
lda div16_a_H
and div16_flag_H
sta div16_0
lda div16_1
ora div16_0
jeq div16_vm_7
lda #$01
sta div16_1
jlt div16_asm_20
lda #0
jmp div16_asm_21
div16_asm_20:
lda #FF
div16_asm_21:
sta div16_0
lda div16_1
ora div16_r_L
sta div16_r_L
lda div16_0
ora div16_r_H
sta div16_r_H
div16_vm_7:
lda div16_r_L
xor div16_b_L
jlt div16_asm_22
lda div16_r_L
sub div16_b_L
jge div16_asm_23
lda #0
jmp div16_asm_24
div16_asm_22:
lda div16_r_L
jge div16_asm_23
lda #0
jmp div16_asm_24
div16_asm_23:
lda #1
div16_asm_24:
sta div16_1
lda div16_1
jeq div16_vm_9
lda div16_r_L
sub div16_b_L
sta div16_r_L
jcs div16_asm_25
lda div16_b_H
xor #$FF
add div16_r_H
jmp div16_asm_26
div16_asm_25:
lda div16_r_H
sub div16_b_H
div16_asm_26:
sta div16_r_H
lda div16_flag_L
ora div16_q_L
sta div16_q_L
lda div16_flag_H
ora div16_q_H
sta div16_q_H
div16_vm_9:
lda div16_flag_H
shr
sta div16_flag_H
jcs div16_asm_27
lda div16_flag_L
shr
jmp div16_asm_28
div16_asm_27:
lda div16_flag_L
shr
ora #$80
div16_asm_28:
sta div16_flag_L
jmp div16_vm_4
div16_vm_5:
lda div16_sign
jeq div16_vm_10
lda #0
sub div16_q_L
sta div16_1
jcs div16_asm_29
lda div16_q_H
xor #$FF
jmp div16_asm_30
div16_asm_29:
lda #0
sub div16_q_H
div16_asm_30:
sta div16_0
jmp div16_vm_11
div16_vm_10:
lda div16_q_L
sta div16_1
lda div16_q_H
sta div16_0
div16_vm_11:
lda div16_1
sta div16_return_L
lda div16_0
sta div16_return_H
div16_end:
ret div16
mod8:
lda #$00
sta mod8_q
lda #$00
sta mod8_r
lda #$00
sta mod8_sign
lda mod8_a
jlt mod8_asm_0
lda #0
jmp mod8_asm_1
mod8_asm_0:
lda #1
mod8_asm_1:
sta mod8_0
lda mod8_0
jeq mod8_vm_1
lda #0
sub mod8_a
sta mod8_a
lda #$01
sta mod8_sign
mod8_vm_1:
lda mod8_b
jlt mod8_asm_2
lda #0
jmp mod8_asm_3
mod8_asm_2:
lda #1
mod8_asm_3:
sta mod8_0
lda mod8_0
jeq mod8_vm_3
lda #0
sub mod8_b
sta mod8_b
mod8_vm_3:
lda #$80
sta mod8_flag
mod8_vm_4:
lda mod8_flag
jeq mod8_vm_5
lda mod8_r
shl
sta mod8_r
lda mod8_a
and mod8_flag
sta mod8_0
lda mod8_0
jeq mod8_vm_7
lda #$01
ora mod8_r
sta mod8_r
mod8_vm_7:
lda mod8_r
xor mod8_b
jlt mod8_asm_4
lda mod8_r
sub mod8_b
jge mod8_asm_5
lda #0
jmp mod8_asm_6
mod8_asm_4:
lda mod8_r
jge mod8_asm_5
lda #0
jmp mod8_asm_6
mod8_asm_5:
lda #1
mod8_asm_6:
sta mod8_0
lda mod8_0
jeq mod8_vm_9
lda mod8_r
sub mod8_b
sta mod8_r
lda mod8_flag
ora mod8_q
sta mod8_q
mod8_vm_9:
lda mod8_flag
shr
sta mod8_flag
jmp mod8_vm_4
mod8_vm_5:
lda mod8_sign
jeq mod8_vm_10
lda #0
sub mod8_r
sta mod8_0
jmp mod8_vm_11
mod8_vm_10:
lda mod8_r
sta mod8_0
mod8_vm_11:
lda mod8_0
sta mod8_return
mod8_end:
ret mod8
mod16:
lda #$00
sta mod16_q_L
jlt mod16_asm_0
lda #0
jmp mod16_asm_1
mod16_asm_0:
lda #FF
mod16_asm_1:
sta mod16_q_H
lda #$00
sta mod16_r_L
jlt mod16_asm_2
lda #0
jmp mod16_asm_3
mod16_asm_2:
lda #FF
mod16_asm_3:
sta mod16_r_H
lda #$00
sta mod16_sign
lda #$00
sta mod16_1
jlt mod16_asm_4
lda #0
jmp mod16_asm_5
mod16_asm_4:
lda #FF
mod16_asm_5:
sta mod16_0
lda mod16_a_L
xor mod16_1
jlt mod16_asm_6
lda mod16_a_L
sub mod16_1
jlt mod16_asm_7
lda #0
jmp mod16_asm_8
mod16_asm_6:
lda mod16_a_L
jlt mod16_asm_7
lda #0
jmp mod16_asm_8
mod16_asm_7:
lda #1
mod16_asm_8:
sta mod16_1
lda mod16_1
jeq mod16_vm_1
lda #0
sub mod16_a_L
sta mod16_a_L
jcs mod16_asm_9
lda mod16_a_H
xor #$FF
jmp mod16_asm_10
mod16_asm_9:
lda #0
sub mod16_a_H
mod16_asm_10:
sta mod16_a_H
lda #$01
sta mod16_sign
mod16_vm_1:
lda #$00
sta mod16_1
jlt mod16_asm_11
lda #0
jmp mod16_asm_12
mod16_asm_11:
lda #FF
mod16_asm_12:
sta mod16_0
lda mod16_b_L
xor mod16_1
jlt mod16_asm_13
lda mod16_b_L
sub mod16_1
jlt mod16_asm_14
lda #0
jmp mod16_asm_15
mod16_asm_13:
lda mod16_b_L
jlt mod16_asm_14
lda #0
jmp mod16_asm_15
mod16_asm_14:
lda #1
mod16_asm_15:
sta mod16_1
lda mod16_1
jeq mod16_vm_3
lda #0
sub mod16_b_L
sta mod16_b_L
jcs mod16_asm_16
lda mod16_b_H
xor #$FF
jmp mod16_asm_17
mod16_asm_16:
lda #0
sub mod16_b_H
mod16_asm_17:
sta mod16_b_H
mod16_vm_3:
lda #$80
sta mod16_flag_L
jlt mod16_asm_18
lda #0
jmp mod16_asm_19
mod16_asm_18:
lda #FF
mod16_asm_19:
sta mod16_flag_H
mod16_vm_4:
lda mod16_flag_L
ora mod16_flag_H
jeq mod16_vm_5
lda mod16_r_L
shl
sta mod16_r_L
jcs mod16_asm_20
lda mod16_r_H
shl
jmp mod16_asm_21
mod16_asm_20:
lda mod16_r_H
shl
ora #1
mod16_asm_21:
sta mod16_r_H
lda mod16_a_L
and mod16_flag_L
sta mod16_1
lda mod16_a_H
and mod16_flag_H
sta mod16_0
lda mod16_1
ora mod16_0
jeq mod16_vm_7
lda #$01
sta mod16_1
jlt mod16_asm_22
lda #0
jmp mod16_asm_23
mod16_asm_22:
lda #FF
mod16_asm_23:
sta mod16_0
lda mod16_1
ora mod16_r_L
sta mod16_r_L
lda mod16_0
ora mod16_r_H
sta mod16_r_H
mod16_vm_7:
lda mod16_r_L
xor mod16_b_L
jlt mod16_asm_24
lda mod16_r_L
sub mod16_b_L
jge mod16_asm_25
lda #0
jmp mod16_asm_26
mod16_asm_24:
lda mod16_r_L
jge mod16_asm_25
lda #0
jmp mod16_asm_26
mod16_asm_25:
lda #1
mod16_asm_26:
sta mod16_1
lda mod16_1
jeq mod16_vm_9
lda mod16_r_L
sub mod16_b_L
sta mod16_r_L
jcs mod16_asm_27
lda mod16_b_H
xor #$FF
add mod16_r_H
jmp mod16_asm_28
mod16_asm_27:
lda mod16_r_H
sub mod16_b_H
mod16_asm_28:
sta mod16_r_H
lda mod16_flag_L
ora mod16_q_L
sta mod16_q_L
lda mod16_flag_H
ora mod16_q_H
sta mod16_q_H
mod16_vm_9:
lda mod16_flag_H
shr
sta mod16_flag_H
jcs mod16_asm_29
lda mod16_flag_L
shr
jmp mod16_asm_30
mod16_asm_29:
lda mod16_flag_L
shr
ora #$80
mod16_asm_30:
sta mod16_flag_L
jmp mod16_vm_4
mod16_vm_5:
lda mod16_sign
jeq mod16_vm_10
lda #0
sub mod16_r_L
sta mod16_1
jcs mod16_asm_31
lda mod16_r_H
xor #$FF
jmp mod16_asm_32
mod16_asm_31:
lda #0
sub mod16_r_H
mod16_asm_32:
sta mod16_0
jmp mod16_vm_11
mod16_vm_10:
lda mod16_r_L
sta mod16_1
lda mod16_r_H
sta mod16_0
mod16_vm_11:
lda mod16_1
sta mod16_return_L
lda mod16_0
sta mod16_return_H
mod16_end:
ret mod16
