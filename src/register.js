const createRegister = (prefix) => {
    let generated = [];
    let available = [];
    let counter = 0;
    return {
        fetch() {
            if (available.length !== 0) {
                return available.pop();
            } else {
                let variable = `${prefix}_${counter++}`;
                generated.push(variable);
                return variable;
            }
        },
        release(variable) {
            if (generated.includes(variable)) {
                available.push(variable);
            }
        },
        getGenerated() {
            return generated;
        },
    };
};


export default createRegister;
