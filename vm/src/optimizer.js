const optimizer = function (instructions) {
    let tmp = false;
    let tmps = [];
    let used = [];
    let toRemove = [];
    let changes = true;
    const areTemps = (v) => v.split(':').every((e) => tmps.includes(e));

    while (changes) {
        changes = false;
        instructions.forEach((e, i) => {
            if (e[0] === '.FUNCTION') {
                tmps = [];
                used = [];
            } else if (e[0] === '.TMP') {
                tmp = true;
            } else if (e[0] === '.BYTE' && tmp) {
                if (toRemove.includes(e[1])) {
                    e[0] = 'NOP';
                    toRemove = toRemove.filter((e) => e !== e[1]);
                } else {
                    tmps.push(e[1]);
                }
            } else if (e[0] === '.RETURN') {
                let unused = tmps.filter((e) => !used.includes(e));
                if (unused.length) {
                    unused.forEach((e) => toRemove.push(e));
                    changes = true;
                }
            } else {
                tmp = false;
            }

            let prev = i - 1 >= 0 ? instructions[i - 1] : [];
            let next = i + 1 < instructions.length ? instructions[i + 1] : [];
            if (!e[0].startsWith('.')) {
                e.forEach((e) => {
                    if (areTemps(e)) {
                        e.split(':').forEach((e) => used.push(e));
                    }
                });
            }
            if (e[0] === 'MOV' && areTemps(e[2]) && prev[1] === e[2]) {
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

export default optimizer;
