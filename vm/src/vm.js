#!/usr/bin/env node

import yargs from 'yargs';
import { readFile } from 'fs';
import parse from './parser.js';
import optimize from './optimizer.js';
import linker from './linker.js';

const { argv } = yargs(process.argv.slice(2))
    .usage('$0 [-o] [-O] [-d] [-m main] filename')
    .boolean(['o', 'O', 'd'])
    .describe('o', 'do optimizations')
    .describe('O', 'optimizations only')
    .describe('d', 'debug comments')
    .default('m', 'main', 'init method')
    .demand(1);


const compile = (text, options) => {
    let program = parse(text);
    if (options.o || options.O) {
        program = optimize(program);
        if (options.O) {
            program.forEach((e) => console.log(e.join(' ')));
            return;
        }
    }
    let instructions = linker(program, options);
    console.log(instructions.join('\n'));
};

readFile(argv._[0], 'utf-8', (error, text) => {
    if (error) {
        console.error(error);
        return;
    }
    compile(text, argv);
});
