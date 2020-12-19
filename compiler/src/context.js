const context = {
    contains(name) {
        return this.containsVar(name) || this.containsArray(name) || this.containsMethod(name);
    },
    containsVar(name) {
        return typeof this[`var_${name}`] !== 'undefined';
    },
    containsMethod(name) {
        return typeof this[`method_${name}`] !== 'undefined';
    },
    containsArray(name) {
        return typeof this[`arr_${name}`] !== 'undefined';
    },
    addVar(name, type) {
        this[`var_${name}`] = type;
    },
    addArray(name, type, dimensions) {
        this[`arr_${name}`] = { type, dimensions };
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
    getArrayType(name) {
        return this[`arr_${name}`].type;
    },
    getMethodType(name = this.currentMethod) {
        return this[`method_${name}`].type;
    },
    getMethodParameters(name = this.currentMethod) {
        return this[`method_${name}`].parameters;
    },
    getArrayDimensions(name) {
        return this[`arr_${name}`].dimensions;
    },
    createContext(method) {
        return Object.assign(Object.create(this), { currentMethod: method });
    },
    isLocal(name) {
        return this.hasOwnProperty(`var_${name}`);
    },
};

export default () => context.createContext();
