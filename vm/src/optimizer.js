const optimize = function (instructions) {
    let tmp = false;
    let tmps = [];
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
        if (e[0] === 'MOV' && tmps.includes(e[2]) && prev[1] === e[2]) {
            prev[1] = e[1];
            e[0] = 'NOP';
        } else if (e[0] === 'JMP' && next[0] === '.LABEL' && next[1] === e[1]) {
            e[0] = 'NOP';
        } else if (e[0] === 'MOV' && e[1] === e[2]) {
            e[0] = 'NOP';
        }
    });
    return instructions.filter((e) => e[0] !== 'NOP');
};

export default optimize;
