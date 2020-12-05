#!/usr/bin/env node

import yargs from 'yargs';
import { readFile } from 'fs';
import parse from './parser.js';
import optimize from './optimizer.js';
import memory from './memory.js';


const { argv } = yargs(process.argv.slice(2))
    .usage('$0 [-o] filename')
    .boolean(['o'])
    .describe('o', 'do optimizations')
    .demand(1);


const compile = (text, options) => {
    let program = parse(text);
    if (options.o) {
        program = optimize(program);
    }
    memory(program);
    // program.forEach(({instruction}) => console.log(instruction.join(' ')));
};

readFile(argv._[0], 'utf-8', (error, text) => {
    if (error) {
        console.error(error);
        return;
    }
    compile(text, argv);
});