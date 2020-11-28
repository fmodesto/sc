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
    getVarType(name) {
        return this[`var_${name}`];
    },
    getMethodType(name) {
        return this[`method_${name}`].type;
    },
    getMethodParameters(name) {
        return this[`method_${name}`].parameters;
    },
    createContext() {
      return Object.create(this);
    }
};

export default () => context.createContext();
