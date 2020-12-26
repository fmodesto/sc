.org $FFE
screen_H:
.byte 0
.org $FFF
screen_L:
.byte 0
.org $000
jsr main
_end_program_:
jmp _end_program_
mul16_return_H:
.byte 0
mul16_return_L:
.byte 0
mul16_a_H:
.byte 0
mul16_a_L:
.byte 0
mul16_b_H:
.byte 0
mul16_b_L:
.byte 0
mul16_res_H:
.byte 0
mul16_res_L:
.byte 0
mul16_flag_H:
.byte 0
mul16_flag_L:
.byte 0
mul16_0:
.byte 0
mul16_1:
.byte 0
sqrt_return_H:
.byte 0
sqrt_return_L:
.byte 0
sqrt_x_H:
.byte 0
sqrt_x_L:
.byte 0
sqrt_left_H:
.byte 0
sqrt_left_L:
.byte 0
sqrt_right_H:
.byte 0
sqrt_right_L:
.byte 0
sqrt_mid_H:
.byte 0
sqrt_mid_L:
.byte 0
sqrt_res_H:
.byte 0
sqrt_res_L:
.byte 0
sqrt_0:
.byte 0
sqrt_1:
.byte 0
main_i_H:
.byte 0
main_i_L:
.byte 0
main_j_H:
.byte 0
main_j_L:
.byte 0
mul16:                        ; .FUNCTION mul16
lda #$01                      ; MOV mul16_flag_H:mul16_flag_L,#$00:#$01
sta mul16_flag_L
lda #$00
sta mul16_flag_H
lda #$00                      ; MOV mul16_res_H:mul16_res_L,#$00:#$00
sta mul16_res_L
lda #$00
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
jcs mul16_asm_0
lda mul16_a_H
jmp mul16_asm_1
mul16_asm_0:
lda mul16_a_H
add #1
mul16_asm_1:
add mul16_res_H
sta mul16_res_H
mul16_vm_3:                   ; .LABEL mul16_vm_3
lda mul16_a_L                 ; SHL mul16_a_H:mul16_a_L,mul16_a_H:mul16_a_L,#$01
shl
sta mul16_a_L
jcs mul16_asm_2
lda mul16_a_H
shl
jmp mul16_asm_3
mul16_asm_2:
lda mul16_a_H
shl
ora #1
mul16_asm_3:
sta mul16_a_H
lda mul16_flag_L              ; SHL mul16_flag_H:mul16_flag_L,mul16_flag_H:mul16_flag_L,#$01
shl
sta mul16_flag_L
jcs mul16_asm_4
lda mul16_flag_H
shl
jmp mul16_asm_5
mul16_asm_4:
lda mul16_flag_H
shl
ora #1
mul16_asm_5:
sta mul16_flag_H
jmp mul16_vm_0                ; JMP mul16_vm_0
mul16_vm_1:                   ; .LABEL mul16_vm_1
lda mul16_res_L               ; MOV mul16_return_H:mul16_return_L,mul16_res_H:mul16_res_L
sta mul16_return_L
lda mul16_res_H
sta mul16_return_H
mul16_end:                    ; .LABEL mul16_end
ret mul16                     ; .ENDFUNCTION mul16
sqrt:                         ; .FUNCTION sqrt
lda sqrt_x_H                  ; LT sqrt_0,sqrt_x_H:sqrt_x_L,#$00:#$02
xor #$00
jlt sqrt_asm_0
lda sqrt_x_H
sub #$00
jlt sqrt_asm_1
jne sqrt_asm_2
lda sqrt_x_L
sub #$02
jnc sqrt_asm_1
lda #0
jmp sqrt_asm_3
sqrt_asm_0:
lda sqrt_x_H
jlt sqrt_asm_1
sqrt_asm_2:
lda #0
jmp sqrt_asm_3
sqrt_asm_1:
lda #1
sqrt_asm_3:
sta sqrt_0
lda sqrt_0                    ; JZ sqrt_vm_1,sqrt_0
jeq sqrt_vm_1
lda sqrt_x_L                  ; MOV sqrt_return_H:sqrt_return_L,sqrt_x_H:sqrt_x_L
sta sqrt_return_L
lda sqrt_x_H
sta sqrt_return_H
jmp sqrt_end                  ; JMP sqrt_end
sqrt_vm_1:                    ; .LABEL sqrt_vm_1
lda #$00                      ; MOV sqrt_left_H:sqrt_left_L,#$00:#$00
sta sqrt_left_L
lda #$00
sta sqrt_left_H
lda #$B5                      ; MOV sqrt_right_H:sqrt_right_L,#$00:#$B5
sta sqrt_right_L
lda #$00
sta sqrt_right_H
lda #$00                      ; MOV sqrt_res_H:sqrt_res_L,#$00:#$00
sta sqrt_res_L
lda #$00
sta sqrt_res_H
sqrt_vm_2:                    ; .LABEL sqrt_vm_2
lda sqrt_left_H               ; LTE sqrt_0,sqrt_left_H:sqrt_left_L,sqrt_right_H:sqrt_right_L
xor sqrt_right_H
jlt sqrt_asm_4
lda sqrt_left_H
sub sqrt_right_H
jlt sqrt_asm_5
jne sqrt_asm_6
lda sqrt_left_L
sub sqrt_right_L
jnc sqrt_asm_5
jeq sqrt_asm_5
lda #0
jmp sqrt_asm_7
sqrt_asm_4:
lda sqrt_left_H
jlt sqrt_asm_5
sqrt_asm_6:
lda #0
jmp sqrt_asm_7
sqrt_asm_5:
lda #1
sqrt_asm_7:
sta sqrt_0
lda sqrt_0                    ; JZ sqrt_vm_3,sqrt_0
jeq sqrt_vm_3
lda sqrt_right_L              ; ADD sqrt_0:sqrt_1,sqrt_left_H:sqrt_left_L,sqrt_right_H:sqrt_right_L
add sqrt_left_L
sta sqrt_1
jcs sqrt_asm_8
lda sqrt_right_H
jmp sqrt_asm_9
sqrt_asm_8:
lda sqrt_right_H
add #1
sqrt_asm_9:
add sqrt_left_H
sta sqrt_0
lda sqrt_0                    ; SHR sqrt_mid_H:sqrt_mid_L,sqrt_0:sqrt_1,#$01
shr
sta sqrt_mid_H
jcs sqrt_asm_10
lda sqrt_1
shr
jmp sqrt_asm_11
sqrt_asm_10:
lda sqrt_1
shr
ora #$80
sqrt_asm_11:
sta sqrt_mid_L
lda sqrt_mid_L                ; MUL sqrt_0:sqrt_1,sqrt_mid_H:sqrt_mid_L,sqrt_mid_H:sqrt_mid_L
sta mul16_b_L
lda sqrt_mid_H
sta mul16_b_H
lda sqrt_mid_L
sta mul16_a_L
lda sqrt_mid_H
sta mul16_a_H
jsr mul16
lda mul16_return_L
sta sqrt_1
lda mul16_return_H
sta sqrt_0
lda sqrt_0                    ; LTE sqrt_1,sqrt_0:sqrt_1,sqrt_x_H:sqrt_x_L
xor sqrt_x_H
jlt sqrt_asm_12
lda sqrt_0
sub sqrt_x_H
jlt sqrt_asm_13
jne sqrt_asm_14
lda sqrt_1
sub sqrt_x_L
jnc sqrt_asm_13
jeq sqrt_asm_13
lda #0
jmp sqrt_asm_15
sqrt_asm_12:
lda sqrt_0
jlt sqrt_asm_13
sqrt_asm_14:
lda #0
jmp sqrt_asm_15
sqrt_asm_13:
lda #1
sqrt_asm_15:
sta sqrt_1
lda sqrt_1                    ; JZ sqrt_vm_4,sqrt_1
jeq sqrt_vm_4
lda #$01                      ; ADD sqrt_left_H:sqrt_left_L,sqrt_mid_H:sqrt_mid_L,#$00:#$01
add sqrt_mid_L
sta sqrt_left_L
jcs sqrt_asm_16
lda #$00
jmp sqrt_asm_17
sqrt_asm_16:
lda #$00
add #1
sqrt_asm_17:
add sqrt_mid_H
sta sqrt_left_H
lda sqrt_mid_L                ; MOV sqrt_res_H:sqrt_res_L,sqrt_mid_H:sqrt_mid_L
sta sqrt_res_L
lda sqrt_mid_H
sta sqrt_res_H
jmp sqrt_vm_5                 ; JMP sqrt_vm_5
sqrt_vm_4:                    ; .LABEL sqrt_vm_4
lda sqrt_mid_L                ; SUB sqrt_right_H:sqrt_right_L,sqrt_mid_H:sqrt_mid_L,#$00:#$01
sub #$01
sta sqrt_right_L
jcs sqrt_asm_18
lda #$00
xor #$FF
add sqrt_mid_H
jmp sqrt_asm_19
sqrt_asm_18:
lda sqrt_mid_H
sub #$00
sqrt_asm_19:
sta sqrt_right_H
sqrt_vm_5:                    ; .LABEL sqrt_vm_5
jmp sqrt_vm_2                 ; JMP sqrt_vm_2
sqrt_vm_3:                    ; .LABEL sqrt_vm_3
lda sqrt_res_L                ; MOV sqrt_return_H:sqrt_return_L,sqrt_res_H:sqrt_res_L
sta sqrt_return_L
lda sqrt_res_H
sta sqrt_return_H
sqrt_end:                     ; .LABEL sqrt_end
ret sqrt                      ; .ENDFUNCTION sqrt
main:                         ; .FUNCTION main
lda #$01                      ; MOV main_i_H:main_i_L,#$00:#$01
sta main_i_L
lda #$00
sta main_i_H
main_vm_0:                    ; .LABEL main_vm_0
lda main_i_L                  ; JZ main_vm_1,main_i_H:main_i_L
ora main_i_H
jeq main_vm_1
lda main_i_L                  ; MOV sqrt_x_H:sqrt_x_L,main_i_H:main_i_L
sta sqrt_x_L
lda main_i_H
sta sqrt_x_H
jsr sqrt                      ; CALL sqrt
lda sqrt_return_L             ; MOV main_j_H:main_j_L,sqrt_return_H:sqrt_return_L
sta main_j_L
lda sqrt_return_H
sta main_j_H
lda main_j_L                  ; MOV screen_H:screen_L,main_j_H:main_j_L
sta screen_L
lda main_j_H
sta screen_H
lda #$01                      ; ADD main_i_H:main_i_L,main_i_H:main_i_L,#$00:#$01
add main_i_L
sta main_i_L
jcs main_asm_0
lda #$00
jmp main_asm_1
main_asm_0:
lda #$00
add #1
main_asm_1:
add main_i_H
sta main_i_H
jmp main_vm_0                 ; JMP main_vm_0
main_vm_1:                    ; .LABEL main_vm_1
main_end:                     ; .LABEL main_end
ret main                      ; .ENDFUNCTION main
