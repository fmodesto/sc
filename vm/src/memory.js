const memory = function (instructions) {
    let current = {
        name: '_global_',
        bytes: [],
        calls: [],
    };
    let scopes = [current];
    let registers = [];
    instructions.forEach((instruction) => {
        if (instruction[0] === '.FUNCTION') {
            current = {
                name: instruction[1],
                bytes: [],
                calls: ['_global_'],
            };
            scopes.push(current);
        } else if (instruction[0] === '.BYTE') {
            current.bytes.push({
                name: instruction[1],
                value: instruction[2],
            });
        } else if (instruction[0] === '.REGISTER') {
            registers.push({
                name: instruction[1],
                address: +instruction[2],
            });
        } else if (instruction[0] === 'CALL' || instruction[0] === '.DEP') {
            current.calls.push(instruction[1]);
        }
    });

    function size(name) {
        let scope = scopes.filter((e) => e.name === name)[0];
        if (typeof scope.size !== 'undefined' && scope.size >= 0) {
            return scope.size;
        } else if (typeof scope.size !== 'undefined') {
            throw new Error('Recursion detected');
        }
        scope.size = -1;
        let allocated = scope.calls.reduce((a, v) => Math.max(a, size(v)), 0);
        scope.size = scope.bytes.length + allocated;
        return scope.size;
    };

    let mem = [];
    scopes.forEach((e) => {
        let total = size(e.name);
        for (let i = 0; i < e.bytes.length; i++) {
            let index = i + total - e.bytes.length;
            mem[index] = [...(mem[index] || []), e.bytes[i]];
        }
    });
    return {
        registers: registers.map((e) => [
            `.org $${e.address.toString(16).toUpperCase().padStart(3, '0')}`,
            `${e.name}:`,
            '.byte 0',
        ]).flat(),
        memory: mem.map((e) => [
            ...e.map(({name}) => `${name}:`),
            `.byte ${e[0].value}`,
        ]).flat(),
    };
};

export default memory;
