const CompileError = {
    create(source, message) {
        return Object.assign(Object.create(this), { source, message });
    },
    print(filename) {
        if (filename)
            console.error(`Error compiling ${filename}`);
        if (this.source)
            console.error(this.source);
        if (this.message)
            console.error(this.message);
    },
};

export default CompileError;
