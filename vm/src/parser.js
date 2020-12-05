const stripComments = /\s*(.*?)\s*(?:(?=\/\/)|$)/;

const parser = function (contents) {
    return contents
        .split('\n')
        .map((line, index) => {
            const instruction = stripComments.exec(line)['1']
                .trim()
                .replace(/\s+/g, ' ')
                .replace(/,/g, ' ')
                .split(' ')
                .filter((e) => e);
            return {
                lineNumber: index + 1,
                line,
                instruction,
            };
        })
        .filter((op) => op.instruction.length !== 0);
};

export default parser;
