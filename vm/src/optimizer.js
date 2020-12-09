const optimize = function (instructions) {
    let tmp = false;
    let tmps = [];
    let changes = true;
    const areTemps = (v) => v.split(':').every((e) => tmps.includes(e));
    const isWidening = (target, src) => target.split(':').length === 2 && src.split(':').length === 1;

    while (changes) {
        changes = false;
        instructions.forEach((e, i) => {
            if (e[0] === '.FUNCTION') {
                tmps = [];
            } else if (e[0] === '.TMP') {
                tmp = true;
            } else if (e[0] === '.BYTE' && tmp) {
                tmps.push(e[1]);
            } else {
                tmp = false;
            }

            let prev = i - 1 >= 0 ? instructions[i - 1] : [];
            let next = i + 1 < instructions.length ? instructions[i + 1] : [];
            if (e[0] === 'MOV' && !isWidening(e[1], e[2]) && areTemps(e[2]) && prev[1] === e[2]) {
                prev[1] = e[1];
                e[0] = 'NOP';
                changes = true;
            } else if (e[0] === 'JMP' && next[0] === '.LABEL' && next[1] === e[1]) {
                e[0] = 'NOP';
                changes = true;
            } else if (e[0] === 'MOV' && e[1] === e[2]) {
                e[0] = 'NOP';
                changes = true;
            }
        });
        instructions = instructions.filter((e) => e[0] !== 'NOP');
    }
    return instructions;
};

export default optimize;
