#!/usr/bin/env node

import yargs from 'yargs';
import { readFile } from 'fs';
import parse from './parser.mjs';
import CompileError from './error.mjs';
import './analyzer.mjs';
import './codegen.mjs';
import './optimizer.mjs';

const { argv } = yargs(process.argv.slice(2))
    .usage('$0 [-a] [-o] filename')
    .boolean(['a', 'o'])
    .describe('a', 'show abstract syntax tree')
    .describe('o', 'do optimizations')
    .demand(1);


const compile = (text, options) => {
    let program = parse(text);
    program.analyze();
    if (options.o) {
        program = program.optimize();
    }
    if (options.a) {
        console.log(program.ast());
        return;
    }
    program.generate().forEach((e) => console.log(e));
};

readFile(argv._[0], 'utf-8', (error, text) => {
    if (error) {
        console.error(error);
        return;
    }
    try {
        compile(text, argv);
    } catch (e) {
        if (CompileError.isPrototypeOf(e))
            e.print();
        else
            throw e;
    }
});
