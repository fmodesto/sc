import { readFileSync } from 'fs';
import parse from './parser.js';
import optimize from './optimizer.js';

const loadDep = function (name) {
    let code = readFileSync(`libraries/${name}.vm`, 'utf-8');
    let program = parse(code);
    return optimize(program);
};

export default loadDep;
