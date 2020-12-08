let program = `
    nop +0
    acc +1
    jmp +4
    acc +3
    jmp -3
    acc -99
    acc +1
    jmp -4
    acc +6`;

let ins = program.split('\n')
    .map((line) => line.trim().split(' ').filter((e) => e))
    .filter((op) => op.length !== 0)
    .map(([op, param]) => [op, +param]);

function run() {
    let acc = 0;
    let pc = 0;
    let vis = {};

    while (typeof vis[pc] === 'undefined' && pc >= 0 && pc < ins.length) {
        vis[pc] = true;
        switch (ins[pc][0]) {
            case 'acc':
                acc += ins[pc][1];
                pc += 1;
                break;
            case 'jmp':
                pc += ins[pc][1];
                break;
            default:
                pc += 1;
                break;
        }
    }
    return [pc < 0 || pc >= ins.length, acc];
}

let [_, acc] = run();
console.log(acc);
for (let i = 0; i < ins.length; i++) {
    if (ins[i][0] === 'nop') {
        ins[i][0] = 'jmp';
        let [res, acc] = run();
        if (res) {
            console.log(acc);
            break;
        }
        ins[i][0] = 'nop';
    } else if (ins[i][0] === 'jmp') {
        ins[i][0] = 'nop';
        let [res, acc] = run();
        if (res) {
            console.log(acc);
            break;
        }
        ins[i][0] = 'jmp';
    }
}
