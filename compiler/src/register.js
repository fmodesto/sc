const createRegister = (prefix) => {
    let generated = [];
    let available = [];
    let counter = 0;
    let label = 0;
    return {
        fetch(type) {
            if (type === 'int') {
                while (available.length < 2) {
                    let variable = `${prefix}_${counter++}`;
                    generated.push(variable);
                    available.push(variable);
                }
                let low = available.pop();
                let high = available.pop();
                return `${high}:${low}`;
            } else if (type === 'char' || type === 'bool') {
                if (available.length !== 0) {
                    return available.pop();
                } else {
                    let variable = `${prefix}_${counter++}`;
                    generated.push(variable);
                    return variable;
                }
            } else {
                throw new Error(`Invalid type for variable ${type}`);
            }
        },
        release(variable) {
            variable.split(':').forEach((e) => {
                if (generated.includes(e)) {
                    available.push(e);
                }
            });
        },
        getGenerated() {
            return generated;
        },
        getInUse() {
            return generated.filter((e) => !available.includes(e));
        },
        generateLabel() {
            return `${prefix}_vm_${label++}`;
        },
    };
};

export default createRegister;
