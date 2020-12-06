const stripComments = /\s*(.*?)\s*(?:(?=\/\/)|$)/;

const parser = function (contents) {
    return contents
        .split('\n')
        .map((line) => {
            const instruction = stripComments.exec(line)['1']
                .trim()
                .replace(/\s+/g, ' ')
                .replace(/,/g, ' ')
                .split(' ')
                .filter((e) => e);
            return instruction;
        })
        .filter((op) => op.length !== 0);
};

export default parser;
