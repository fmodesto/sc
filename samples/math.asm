test:
.byte 0
mul8_return:
div8_return:
mod8_return:
shl8_return:
shr8_return:
.byte 0
mul8_a:
div8_a:
mod8_a:
shl8_a:
shr8_a:
.byte 0
mul8_b:
div8_b:
mod8_b:
shl8_b:
shr8_b:
.byte 0
mul8_res:
div8_q:
mod8_q:
shl8_0:
shr8_0:
.byte 0
mul8_flag:
div8_r:
mod8_r:
.byte 0
mul8_sign:
div8_flag:
mod8_flag:
.byte 0
mul8_0:
div8_sign:
mod8_sign:
.byte 0
div8_0:
mod8_0:
.byte 0
mul8:
lda #1
sta mul8_flag
lda #0
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
div8:
lda #0
sta div8_q
lda #0
sta div8_r
lda #0
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
lda #1
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
lda #1
xor div8_sign
sta div8_sign
div8_vm_3:
lda #128
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
lda #1
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
mod8:
lda #0
sta mod8_q
lda #0
sta mod8_r
lda #0
sta mod8_sign
lda mod8_a
jlt mod8_asm_7
lda #0
jmp mod8_asm_8
mod8_asm_7:
lda #1
mod8_asm_8:
sta mod8_0
lda mod8_0
jeq mod8_vm_1
lda #0
sub mod8_a
sta mod8_a
lda #1
sta mod8_sign
mod8_vm_1:
lda mod8_b
jlt mod8_asm_9
lda #0
jmp mod8_asm_10
mod8_asm_9:
lda #1
mod8_asm_10:
sta mod8_0
lda mod8_0
jeq mod8_vm_3
lda #0
sub mod8_b
sta mod8_b
mod8_vm_3:
lda #128
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
lda #1
ora mod8_r
sta mod8_r
mod8_vm_7:
lda mod8_r
xor mod8_b
jlt mod8_asm_11
lda mod8_r
sub mod8_b
jge mod8_asm_12
lda #0
jmp mod8_asm_13
mod8_asm_11:
lda mod8_r
jge mod8_asm_12
lda #0
jmp mod8_asm_13
mod8_asm_12:
lda #1
mod8_asm_13:
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
shl8:
lda #7
and shl8_b
sta shl8_b
shl8_vm_0:
lda shl8_b
jeq shl8_vm_1
lda shl8_a
shl
sta shl8_a
lda shl8_b
sub #1
sta shl8_b
jmp shl8_vm_0
shl8_vm_1:
lda shl8_a
sta shl8_return
shl8_end:
ret shl8
shr8:
lda #7
and shr8_b
sta shr8_b
shr8_vm_0:
lda shr8_b
jeq shr8_vm_1
lda shr8_a
shr
sta shr8_a
lda shr8_b
sub #1
sta shr8_b
jmp shr8_vm_0
shr8_vm_1:
lda shr8_a
sta shr8_return
shr8_end:
ret shr8
