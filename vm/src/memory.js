const memory = function (instructions) {
    let current = {
        name: '_global_',
        bytes: [],
        calls: [],
    };
    let scopes = [current];
    let registers = [];
    let arrays = [];
    let switchContext = false;
    instructions.forEach((instruction) => {
        if (instruction[0] === '.STATIC') {
            switchContext = true;
            current = scopes[0];
        } else if (switchContext && instruction[0] !== '.BYTE' && instruction[0] !== '.RBYTE') {
            switchContext = false;
            current = scopes[scopes.length - 1];
        }

        if (instruction[0] === '.FUNCTION') {
            current = {
                name: instruction[1],
                bytes: [],
                calls: ['_global_'],
            };
            scopes.push(current);
        } else if (instruction[0] === '.EXTERN') {
            current = {
                name: instruction[1],
                bytes: [],
                calls: [],
            };
        } else if (instruction[0] === '.ENDFUNCTION' || instruction[0] === '.ENDEXTERN') {
            current = scopes[0];
        } else if (instruction[0] === '.BYTE') {
            current.bytes.push({
                name: instruction[1],
                value: instruction[2],
            });
        } else if (instruction[0] === '.RBYTE') {
            registers.push({
                name: instruction[1],
                address: +instruction[2],
            });
        } else if (instruction[0] === '.ARRAY') {
            arrays.push({
                name: instruction[1],
                value: instruction.slice(2),
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
            ...e.map(({ name }) => `${name}:`),
            `.byte ${e[0].value}`,
        ]).flat(),
    };
};

export default memory;
