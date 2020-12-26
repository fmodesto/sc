const stripComments = /\s*(.*?)\s*(?:(?=\/\/)|$)/;

const parser = function (contents) {
    let src = contents
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
    let code = [];
    let tmp = null;
    for (let i = 0; i < src.length; i++) {
        if (src[i][0] === '.ASM') {
            tmp = code;
            code = [];
        } else if (src[i][0] === '.ENDFUNCTION') {
            if (tmp !== null) {
                tmp.push(['.ASM', ...code.map((e) => e.join(' '))]);
                code = tmp;
                tmp = null;
            }
            code.push(src[i]);
        } else {
            code.push(src[i]);
        }
    }
    return code;
};

export default parser;
