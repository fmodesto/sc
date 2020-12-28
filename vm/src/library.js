import { readFileSync } from 'fs';
import parse from './parser.js';
import optimize from './optimizer.js';

const loadDep = function (name) {
    try {
        let code = readFileSync(`libraries/${name}.vm`, 'utf-8');
        let program = parse(code);
        return optimize(program);
    } catch (e) {
        throw new Error(`Dependency '${name}' not found`);
    }
};

export default loadDep;
