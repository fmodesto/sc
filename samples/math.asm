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
mul8:                         ; .FUNCTION mul8
lda #$01                      ; MOV mul8_flag,#$01
sta mul8_flag
lda #$00                      ; MOV mul8_res,#$00
sta mul8_res
mul8_vm_0:                    ; .LABEL mul8_vm_0
lda mul8_flag                 ; JZ mul8_vm_1,mul8_flag
jeq mul8_vm_1
lda mul8_b                    ; AND mul8_0,mul8_flag,mul8_b
and mul8_flag
sta mul8_0
lda mul8_0                    ; JZ mul8_vm_3,mul8_0
jeq mul8_vm_3
lda mul8_a                    ; ADD mul8_res,mul8_res,mul8_a
add mul8_res
sta mul8_res
mul8_vm_3:                    ; .LABEL mul8_vm_3
lda mul8_a                    ; SHL mul8_a,mul8_a,#$01
shl
sta mul8_a
lda mul8_flag                 ; SHL mul8_flag,mul8_flag,#$01
shl
sta mul8_flag
jmp mul8_vm_0                 ; JMP mul8_vm_0
mul8_vm_1:                    ; .LABEL mul8_vm_1
lda mul8_res                  ; MOV mul8_return,mul8_res
sta mul8_return
mul8_end:                     ; .LABEL mul8_end
ret mul8                      ; .RETURN mul8
mul16:                        ; .FUNCTION mul16
lda #$01                      ; CAST mul16_flag_H:mul16_flag_L,#$01
sta mul16_flag_L
jlt mul16_asm_0
lda #0
jmp mul16_asm_1
mul16_asm_0:
lda #$FF
mul16_asm_1:
sta mul16_flag_H
lda #$00                      ; CAST mul16_res_H:mul16_res_L,#$00
sta mul16_res_L
jlt mul16_asm_2
lda #0
jmp mul16_asm_3
mul16_asm_2:
lda #$FF
mul16_asm_3:
sta mul16_res_H
mul16_vm_0:                   ; .LABEL mul16_vm_0
lda mul16_flag_L              ; JZ mul16_vm_1,mul16_flag_H:mul16_flag_L
ora mul16_flag_H
jeq mul16_vm_1
lda mul16_b_L                 ; AND mul16_0:mul16_1,mul16_flag_H:mul16_flag_L,mul16_b_H:mul16_b_L
and mul16_flag_L
sta mul16_1
lda mul16_b_H
and mul16_flag_H
sta mul16_0
lda mul16_1                   ; JZ mul16_vm_3,mul16_0:mul16_1
ora mul16_0
jeq mul16_vm_3
lda mul16_a_L                 ; ADD mul16_res_H:mul16_res_L,mul16_res_H:mul16_res_L,mul16_a_H:mul16_a_L
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
mul16_vm_3:                   ; .LABEL mul16_vm_3
lda mul16_a_L                 ; SHL mul16_a_H:mul16_a_L,mul16_a_H:mul16_a_L,#$01
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
lda mul16_flag_L              ; SHL mul16_flag_H:mul16_flag_L,mul16_flag_H:mul16_flag_L,#$01
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
jmp mul16_vm_0                ; JMP mul16_vm_0
mul16_vm_1:                   ; .LABEL mul16_vm_1
lda mul16_res_L               ; MOV mul16_return_H:mul16_return_L,mul16_res_H:mul16_res_L
sta mul16_return_L
lda mul16_res_H
sta mul16_return_H
mul16_end:                    ; .LABEL mul16_end
ret mul16                     ; .RETURN mul16
div8:                         ; .FUNCTION div8
lda #$00                      ; MOV div8_q,#$00
sta div8_q
lda #$00                      ; MOV div8_r,#$00
sta div8_r
lda #$00                      ; MOV div8_sign,#$00
sta div8_sign
lda div8_a                    ; LT div8_0,div8_a,#$00
jlt div8_asm_0
lda #0
jmp div8_asm_1
div8_asm_0:
lda #1
div8_asm_1:
sta div8_0
lda div8_0                    ; JZ div8_vm_1,div8_0
jeq div8_vm_1
lda #0                        ; NEG div8_a,div8_a
sub div8_a
sta div8_a
lda #$01                      ; MOV div8_sign,#$01
sta div8_sign
div8_vm_1:                    ; .LABEL div8_vm_1
lda div8_b                    ; LT div8_0,div8_b,#$00
jlt div8_asm_2
lda #0
jmp div8_asm_3
div8_asm_2:
lda #1
div8_asm_3:
sta div8_0
lda div8_0                    ; JZ div8_vm_3,div8_0
jeq div8_vm_3
lda #0                        ; NEG div8_b,div8_b
sub div8_b
sta div8_b
lda #$01                      ; XOR div8_sign,div8_sign,#$01
xor div8_sign
sta div8_sign
div8_vm_3:                    ; .LABEL div8_vm_3
lda #$80                      ; MOV div8_flag,#$80
sta div8_flag
div8_vm_4:                    ; .LABEL div8_vm_4
lda div8_flag                 ; JZ div8_vm_5,div8_flag
jeq div8_vm_5
lda div8_r                    ; SHL div8_r,div8_r,#$01
shl
sta div8_r
lda div8_a                    ; AND div8_0,div8_flag,div8_a
and div8_flag
sta div8_0
lda div8_0                    ; JZ div8_vm_7,div8_0
jeq div8_vm_7
lda #$01                      ; OR div8_r,div8_r,#$01
ora div8_r
sta div8_r
div8_vm_7:                    ; .LABEL div8_vm_7
lda div8_b                    ; GTE div8_0,div8_r,div8_b
xor div8_r
jeq div8_asm_5
jlt div8_asm_4
lda div8_b
sub div8_r
jlt div8_asm_5
lda #0
jmp div8_asm_6
div8_asm_4:
lda div8_b
jlt div8_asm_5
lda #0
jmp div8_asm_6
div8_asm_5:
lda #1
div8_asm_6:
sta div8_0
lda div8_0                    ; JZ div8_vm_9,div8_0
jeq div8_vm_9
lda div8_r                    ; SUB div8_r,div8_r,div8_b
sub div8_b
sta div8_r
lda div8_flag                 ; OR div8_q,div8_q,div8_flag
ora div8_q
sta div8_q
div8_vm_9:                    ; .LABEL div8_vm_9
lda div8_flag                 ; SHR div8_flag,div8_flag,#$01
shr
sta div8_flag
jmp div8_vm_4                 ; JMP div8_vm_4
div8_vm_5:                    ; .LABEL div8_vm_5
lda div8_sign                 ; JZ div8_vm_10,div8_sign
jeq div8_vm_10
lda #0                        ; NEG div8_0,div8_q
sub div8_q
sta div8_0
jmp div8_vm_11                ; JMP div8_vm_11
div8_vm_10:                   ; .LABEL div8_vm_10
lda div8_q                    ; MOV div8_0,div8_q
sta div8_0
div8_vm_11:                   ; .LABEL div8_vm_11
lda div8_0                    ; MOV div8_return,div8_0
sta div8_return
div8_end:                     ; .LABEL div8_end
ret div8                      ; .RETURN div8
div16:                        ; .FUNCTION div16
lda #$00                      ; CAST div16_q_H:div16_q_L,#$00
sta div16_q_L
jlt div16_asm_0
lda #0
jmp div16_asm_1
div16_asm_0:
lda #$FF
div16_asm_1:
sta div16_q_H
lda #$00                      ; CAST div16_r_H:div16_r_L,#$00
sta div16_r_L
jlt div16_asm_2
lda #0
jmp div16_asm_3
div16_asm_2:
lda #$FF
div16_asm_3:
sta div16_r_H
lda #$00                      ; MOV div16_sign,#$00
sta div16_sign
lda #$00                      ; CAST div16_0:div16_1,#$00
sta div16_1
jlt div16_asm_4
lda #0
jmp div16_asm_5
div16_asm_4:
lda #$FF
div16_asm_5:
sta div16_0
lda div16_a_H                 ; LT div16_1,div16_a_H:div16_a_L,div16_0:div16_1
xor div16_0
jlt div16_asm_6
lda div16_a_H
sub div16_0
jlt div16_asm_7
jne div16_asm_8
lda div16_a_L
sub div16_1
jnc div16_asm_7
lda #0
jmp div16_asm_9
div16_asm_6:
lda div16_a_H
jlt div16_asm_7
div16_asm_8:
lda #0
jmp div16_asm_9
div16_asm_7:
lda #1
div16_asm_9:
sta div16_1
lda div16_1                   ; JZ div16_vm_1,div16_1
jeq div16_vm_1
lda #0                        ; NEG div16_a_H:div16_a_L,div16_a_H:div16_a_L
sub div16_a_L
sta div16_a_L
jcs div16_asm_10
lda div16_a_H
xor #$FF
jmp div16_asm_11
div16_asm_10:
lda #0
sub div16_a_H
div16_asm_11:
sta div16_a_H
lda #$01                      ; MOV div16_sign,#$01
sta div16_sign
div16_vm_1:                   ; .LABEL div16_vm_1
lda #$00                      ; CAST div16_0:div16_1,#$00
sta div16_1
jlt div16_asm_12
lda #0
jmp div16_asm_13
div16_asm_12:
lda #$FF
div16_asm_13:
sta div16_0
lda div16_b_H                 ; LT div16_1,div16_b_H:div16_b_L,div16_0:div16_1
xor div16_0
jlt div16_asm_14
lda div16_b_H
sub div16_0
jlt div16_asm_15
jne div16_asm_16
lda div16_b_L
sub div16_1
jnc div16_asm_15
lda #0
jmp div16_asm_17
div16_asm_14:
lda div16_b_H
jlt div16_asm_15
div16_asm_16:
lda #0
jmp div16_asm_17
div16_asm_15:
lda #1
div16_asm_17:
sta div16_1
lda div16_1                   ; JZ div16_vm_3,div16_1
jeq div16_vm_3
lda #0                        ; NEG div16_b_H:div16_b_L,div16_b_H:div16_b_L
sub div16_b_L
sta div16_b_L
jcs div16_asm_18
lda div16_b_H
xor #$FF
jmp div16_asm_19
div16_asm_18:
lda #0
sub div16_b_H
div16_asm_19:
sta div16_b_H
lda #$01                      ; XOR div16_sign,div16_sign,#$01
xor div16_sign
sta div16_sign
div16_vm_3:                   ; .LABEL div16_vm_3
lda #$00                      ; MOV div16_flag_H:div16_flag_L,#$80:#$00
sta div16_flag_L
lda #$80
sta div16_flag_H
div16_vm_4:                   ; .LABEL div16_vm_4
lda div16_flag_L              ; JZ div16_vm_5,div16_flag_H:div16_flag_L
ora div16_flag_H
jeq div16_vm_5
lda div16_r_L                 ; SHL div16_r_H:div16_r_L,div16_r_H:div16_r_L,#$01
shl
sta div16_r_L
jcs div16_asm_20
lda div16_r_H
shl
jmp div16_asm_21
div16_asm_20:
lda div16_r_H
shl
ora #1
div16_asm_21:
sta div16_r_H
lda div16_a_L                 ; AND div16_0:div16_1,div16_flag_H:div16_flag_L,div16_a_H:div16_a_L
and div16_flag_L
sta div16_1
lda div16_a_H
and div16_flag_H
sta div16_0
lda div16_1                   ; JZ div16_vm_7,div16_0:div16_1
ora div16_0
jeq div16_vm_7
lda #$01                      ; CAST div16_0:div16_1,#$01
sta div16_1
jlt div16_asm_22
lda #0
jmp div16_asm_23
div16_asm_22:
lda #$FF
div16_asm_23:
sta div16_0
lda div16_1                   ; OR div16_r_H:div16_r_L,div16_r_H:div16_r_L,div16_0:div16_1
ora div16_r_L
sta div16_r_L
lda div16_0
ora div16_r_H
sta div16_r_H
div16_vm_7:                   ; .LABEL div16_vm_7
lda div16_b_H                 ; GTE div16_1,div16_r_H:div16_r_L,div16_b_H:div16_b_L
xor div16_r_H
jlt div16_asm_24
lda div16_b_H
sub div16_r_H
jlt div16_asm_25
jne div16_asm_26
lda div16_b_L
sub div16_r_L
jnc div16_asm_25
jeq div16_asm_25
lda #0
jmp div16_asm_27
div16_asm_24:
lda div16_b_H
jlt div16_asm_25
div16_asm_26:
lda #0
jmp div16_asm_27
div16_asm_25:
lda #1
div16_asm_27:
sta div16_1
lda div16_1                   ; JZ div16_vm_9,div16_1
jeq div16_vm_9
lda div16_r_L                 ; SUB div16_r_H:div16_r_L,div16_r_H:div16_r_L,div16_b_H:div16_b_L
sub div16_b_L
sta div16_r_L
jcs div16_asm_28
lda div16_b_H
xor #$FF
add div16_r_H
jmp div16_asm_29
div16_asm_28:
lda div16_r_H
sub div16_b_H
div16_asm_29:
sta div16_r_H
lda div16_flag_L              ; OR div16_q_H:div16_q_L,div16_q_H:div16_q_L,div16_flag_H:div16_flag_L
ora div16_q_L
sta div16_q_L
lda div16_flag_H
ora div16_q_H
sta div16_q_H
div16_vm_9:                   ; .LABEL div16_vm_9
lda div16_flag_H              ; SHR div16_flag_H:div16_flag_L,div16_flag_H:div16_flag_L,#$01
shr
sta div16_flag_H
jcs div16_asm_30
lda div16_flag_L
shr
jmp div16_asm_31
div16_asm_30:
lda div16_flag_L
shr
ora #$80
div16_asm_31:
sta div16_flag_L
jmp div16_vm_4                ; JMP div16_vm_4
div16_vm_5:                   ; .LABEL div16_vm_5
lda div16_sign                ; JZ div16_vm_10,div16_sign
jeq div16_vm_10
lda #0                        ; NEG div16_0:div16_1,div16_q_H:div16_q_L
sub div16_q_L
sta div16_1
jcs div16_asm_32
lda div16_q_H
xor #$FF
jmp div16_asm_33
div16_asm_32:
lda #0
sub div16_q_H
div16_asm_33:
sta div16_0
jmp div16_vm_11               ; JMP div16_vm_11
div16_vm_10:                  ; .LABEL div16_vm_10
lda div16_q_L                 ; MOV div16_0:div16_1,div16_q_H:div16_q_L
sta div16_1
lda div16_q_H
sta div16_0
div16_vm_11:                  ; .LABEL div16_vm_11
lda div16_1                   ; MOV div16_return_H:div16_return_L,div16_0:div16_1
sta div16_return_L
lda div16_0
sta div16_return_H
div16_end:                    ; .LABEL div16_end
ret div16                     ; .RETURN div16
mod8:                         ; .FUNCTION mod8
lda #$00                      ; MOV mod8_q,#$00
sta mod8_q
lda #$00                      ; MOV mod8_r,#$00
sta mod8_r
lda #$00                      ; MOV mod8_sign,#$00
sta mod8_sign
lda mod8_a                    ; LT mod8_0,mod8_a,#$00
jlt mod8_asm_0
lda #0
jmp mod8_asm_1
mod8_asm_0:
lda #1
mod8_asm_1:
sta mod8_0
lda mod8_0                    ; JZ mod8_vm_1,mod8_0
jeq mod8_vm_1
lda #0                        ; NEG mod8_a,mod8_a
sub mod8_a
sta mod8_a
lda #$01                      ; MOV mod8_sign,#$01
sta mod8_sign
mod8_vm_1:                    ; .LABEL mod8_vm_1
lda mod8_b                    ; LT mod8_0,mod8_b,#$00
jlt mod8_asm_2
lda #0
jmp mod8_asm_3
mod8_asm_2:
lda #1
mod8_asm_3:
sta mod8_0
lda mod8_0                    ; JZ mod8_vm_3,mod8_0
jeq mod8_vm_3
lda #0                        ; NEG mod8_b,mod8_b
sub mod8_b
sta mod8_b
mod8_vm_3:                    ; .LABEL mod8_vm_3
lda #$80                      ; MOV mod8_flag,#$80
sta mod8_flag
mod8_vm_4:                    ; .LABEL mod8_vm_4
lda mod8_flag                 ; JZ mod8_vm_5,mod8_flag
jeq mod8_vm_5
lda mod8_r                    ; SHL mod8_r,mod8_r,#$01
shl
sta mod8_r
lda mod8_a                    ; AND mod8_0,mod8_flag,mod8_a
and mod8_flag
sta mod8_0
lda mod8_0                    ; JZ mod8_vm_7,mod8_0
jeq mod8_vm_7
lda #$01                      ; OR mod8_r,mod8_r,#$01
ora mod8_r
sta mod8_r
mod8_vm_7:                    ; .LABEL mod8_vm_7
lda mod8_b                    ; GTE mod8_0,mod8_r,mod8_b
xor mod8_r
jeq mod8_asm_5
jlt mod8_asm_4
lda mod8_b
sub mod8_r
jlt mod8_asm_5
lda #0
jmp mod8_asm_6
mod8_asm_4:
lda mod8_b
jlt mod8_asm_5
lda #0
jmp mod8_asm_6
mod8_asm_5:
lda #1
mod8_asm_6:
sta mod8_0
lda mod8_0                    ; JZ mod8_vm_9,mod8_0
jeq mod8_vm_9
lda mod8_r                    ; SUB mod8_r,mod8_r,mod8_b
sub mod8_b
sta mod8_r
lda mod8_flag                 ; OR mod8_q,mod8_q,mod8_flag
ora mod8_q
sta mod8_q
mod8_vm_9:                    ; .LABEL mod8_vm_9
lda mod8_flag                 ; SHR mod8_flag,mod8_flag,#$01
shr
sta mod8_flag
jmp mod8_vm_4                 ; JMP mod8_vm_4
mod8_vm_5:                    ; .LABEL mod8_vm_5
lda mod8_sign                 ; JZ mod8_vm_10,mod8_sign
jeq mod8_vm_10
lda #0                        ; NEG mod8_0,mod8_r
sub mod8_r
sta mod8_0
jmp mod8_vm_11                ; JMP mod8_vm_11
mod8_vm_10:                   ; .LABEL mod8_vm_10
lda mod8_r                    ; MOV mod8_0,mod8_r
sta mod8_0
mod8_vm_11:                   ; .LABEL mod8_vm_11
lda mod8_0                    ; MOV mod8_return,mod8_0
sta mod8_return
mod8_end:                     ; .LABEL mod8_end
ret mod8                      ; .RETURN mod8
mod16:                        ; .FUNCTION mod16
lda #$00                      ; CAST mod16_q_H:mod16_q_L,#$00
sta mod16_q_L
jlt mod16_asm_0
lda #0
jmp mod16_asm_1
mod16_asm_0:
lda #$FF
mod16_asm_1:
sta mod16_q_H
lda #$00                      ; CAST mod16_r_H:mod16_r_L,#$00
sta mod16_r_L
jlt mod16_asm_2
lda #0
jmp mod16_asm_3
mod16_asm_2:
lda #$FF
mod16_asm_3:
sta mod16_r_H
lda #$00                      ; MOV mod16_sign,#$00
sta mod16_sign
lda #$00                      ; CAST mod16_0:mod16_1,#$00
sta mod16_1
jlt mod16_asm_4
lda #0
jmp mod16_asm_5
mod16_asm_4:
lda #$FF
mod16_asm_5:
sta mod16_0
lda mod16_a_H                 ; LT mod16_1,mod16_a_H:mod16_a_L,mod16_0:mod16_1
xor mod16_0
jlt mod16_asm_6
lda mod16_a_H
sub mod16_0
jlt mod16_asm_7
jne mod16_asm_8
lda mod16_a_L
sub mod16_1
jnc mod16_asm_7
lda #0
jmp mod16_asm_9
mod16_asm_6:
lda mod16_a_H
jlt mod16_asm_7
mod16_asm_8:
lda #0
jmp mod16_asm_9
mod16_asm_7:
lda #1
mod16_asm_9:
sta mod16_1
lda mod16_1                   ; JZ mod16_vm_1,mod16_1
jeq mod16_vm_1
lda #0                        ; NEG mod16_a_H:mod16_a_L,mod16_a_H:mod16_a_L
sub mod16_a_L
sta mod16_a_L
jcs mod16_asm_10
lda mod16_a_H
xor #$FF
jmp mod16_asm_11
mod16_asm_10:
lda #0
sub mod16_a_H
mod16_asm_11:
sta mod16_a_H
lda #$01                      ; MOV mod16_sign,#$01
sta mod16_sign
mod16_vm_1:                   ; .LABEL mod16_vm_1
lda #$00                      ; CAST mod16_0:mod16_1,#$00
sta mod16_1
jlt mod16_asm_12
lda #0
jmp mod16_asm_13
mod16_asm_12:
lda #$FF
mod16_asm_13:
sta mod16_0
lda mod16_b_H                 ; LT mod16_1,mod16_b_H:mod16_b_L,mod16_0:mod16_1
xor mod16_0
jlt mod16_asm_14
lda mod16_b_H
sub mod16_0
jlt mod16_asm_15
jne mod16_asm_16
lda mod16_b_L
sub mod16_1
jnc mod16_asm_15
lda #0
jmp mod16_asm_17
mod16_asm_14:
lda mod16_b_H
jlt mod16_asm_15
mod16_asm_16:
lda #0
jmp mod16_asm_17
mod16_asm_15:
lda #1
mod16_asm_17:
sta mod16_1
lda mod16_1                   ; JZ mod16_vm_3,mod16_1
jeq mod16_vm_3
lda #0                        ; NEG mod16_b_H:mod16_b_L,mod16_b_H:mod16_b_L
sub mod16_b_L
sta mod16_b_L
jcs mod16_asm_18
lda mod16_b_H
xor #$FF
jmp mod16_asm_19
mod16_asm_18:
lda #0
sub mod16_b_H
mod16_asm_19:
sta mod16_b_H
mod16_vm_3:                   ; .LABEL mod16_vm_3
lda #$80                      ; CAST mod16_flag_H:mod16_flag_L,#$80
sta mod16_flag_L
jlt mod16_asm_20
lda #0
jmp mod16_asm_21
mod16_asm_20:
lda #$FF
mod16_asm_21:
sta mod16_flag_H
mod16_vm_4:                   ; .LABEL mod16_vm_4
lda mod16_flag_L              ; JZ mod16_vm_5,mod16_flag_H:mod16_flag_L
ora mod16_flag_H
jeq mod16_vm_5
lda mod16_r_L                 ; SHL mod16_r_H:mod16_r_L,mod16_r_H:mod16_r_L,#$01
shl
sta mod16_r_L
jcs mod16_asm_22
lda mod16_r_H
shl
jmp mod16_asm_23
mod16_asm_22:
lda mod16_r_H
shl
ora #1
mod16_asm_23:
sta mod16_r_H
lda mod16_a_L                 ; AND mod16_0:mod16_1,mod16_flag_H:mod16_flag_L,mod16_a_H:mod16_a_L
and mod16_flag_L
sta mod16_1
lda mod16_a_H
and mod16_flag_H
sta mod16_0
lda mod16_1                   ; JZ mod16_vm_7,mod16_0:mod16_1
ora mod16_0
jeq mod16_vm_7
lda #$01                      ; CAST mod16_0:mod16_1,#$01
sta mod16_1
jlt mod16_asm_24
lda #0
jmp mod16_asm_25
mod16_asm_24:
lda #$FF
mod16_asm_25:
sta mod16_0
lda mod16_1                   ; OR mod16_r_H:mod16_r_L,mod16_r_H:mod16_r_L,mod16_0:mod16_1
ora mod16_r_L
sta mod16_r_L
lda mod16_0
ora mod16_r_H
sta mod16_r_H
mod16_vm_7:                   ; .LABEL mod16_vm_7
lda mod16_b_H                 ; GTE mod16_1,mod16_r_H:mod16_r_L,mod16_b_H:mod16_b_L
xor mod16_r_H
jlt mod16_asm_26
lda mod16_b_H
sub mod16_r_H
jlt mod16_asm_27
jne mod16_asm_28
lda mod16_b_L
sub mod16_r_L
jnc mod16_asm_27
jeq mod16_asm_27
lda #0
jmp mod16_asm_29
mod16_asm_26:
lda mod16_b_H
jlt mod16_asm_27
mod16_asm_28:
lda #0
jmp mod16_asm_29
mod16_asm_27:
lda #1
mod16_asm_29:
sta mod16_1
lda mod16_1                   ; JZ mod16_vm_9,mod16_1
jeq mod16_vm_9
lda mod16_r_L                 ; SUB mod16_r_H:mod16_r_L,mod16_r_H:mod16_r_L,mod16_b_H:mod16_b_L
sub mod16_b_L
sta mod16_r_L
jcs mod16_asm_30
lda mod16_b_H
xor #$FF
add mod16_r_H
jmp mod16_asm_31
mod16_asm_30:
lda mod16_r_H
sub mod16_b_H
mod16_asm_31:
sta mod16_r_H
lda mod16_flag_L              ; OR mod16_q_H:mod16_q_L,mod16_q_H:mod16_q_L,mod16_flag_H:mod16_flag_L
ora mod16_q_L
sta mod16_q_L
lda mod16_flag_H
ora mod16_q_H
sta mod16_q_H
mod16_vm_9:                   ; .LABEL mod16_vm_9
lda mod16_flag_H              ; SHR mod16_flag_H:mod16_flag_L,mod16_flag_H:mod16_flag_L,#$01
shr
sta mod16_flag_H
jcs mod16_asm_32
lda mod16_flag_L
shr
jmp mod16_asm_33
mod16_asm_32:
lda mod16_flag_L
shr
ora #$80
mod16_asm_33:
sta mod16_flag_L
jmp mod16_vm_4                ; JMP mod16_vm_4
mod16_vm_5:                   ; .LABEL mod16_vm_5
lda mod16_sign                ; JZ mod16_vm_10,mod16_sign
jeq mod16_vm_10
lda #0                        ; NEG mod16_0:mod16_1,mod16_r_H:mod16_r_L
sub mod16_r_L
sta mod16_1
jcs mod16_asm_34
lda mod16_r_H
xor #$FF
jmp mod16_asm_35
mod16_asm_34:
lda #0
sub mod16_r_H
mod16_asm_35:
sta mod16_0
jmp mod16_vm_11               ; JMP mod16_vm_11
mod16_vm_10:                  ; .LABEL mod16_vm_10
lda mod16_r_L                 ; MOV mod16_0:mod16_1,mod16_r_H:mod16_r_L
sta mod16_1
lda mod16_r_H
sta mod16_0
mod16_vm_11:                  ; .LABEL mod16_vm_11
lda mod16_1                   ; MOV mod16_return_H:mod16_return_L,mod16_0:mod16_1
sta mod16_return_L
lda mod16_0
sta mod16_return_H
mod16_end:                    ; .LABEL mod16_end
ret mod16                     ; .RETURN mod16
