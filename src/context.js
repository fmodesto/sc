const context = {
    containsVar(name) {
        return typeof this[`var_${name}`] !== 'undefined';
    },
    containsMethod(name) {
        return typeof this[`method_${name}`] !== 'undefined';
    },
    addVar(name, type) {
        this[`var_${name}`] = type;
    },
    addMethod(name, type, parameters) {
        this[`method_${name}`] = {
            type,
            parameters,
        };
    },
    getCurrentMethod() {
        return this.currentMethod;
    },
    getVarType(name) {
        return this[`var_${name}`];
    },
    getMethodType(name = this.currentMethod) {
        return this[`method_${name}`].type;
    },
    getMethodParameters(name = this.currentMethod) {
        return this[`method_${name}`].parameters;
    },
    createContext(method) {
        return Object.assign(Object.create(this), { currentMethod: method });
    },
    isLocal(name) {
        return this.hasOwnProperty(`var_${name}`);
    },
};

export default () => context.createContext();
