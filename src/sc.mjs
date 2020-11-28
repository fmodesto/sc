#!/usr/bin/env node

import yargs from 'yargs';
import { readFile } from 'fs';
import parse from './parser.mjs';
import analyze from './analyzer.mjs';
import './optimizer.mjs';
// import graphView from './semantics/viewer';
// import './semantics/optimizer';
import CompileError from './error.mjs';

const { argv } = yargs(process.argv.slice(2))
  .usage('$0 [-a] [-o] filename')
  .boolean(['a', 'o'])
  .describe('a', 'show abstract syntax tree after parsing then stop')
  .describe('o', 'do optimizations')
  .demand(1);

const compile = (text, options) => {
  let program = parse(text);
  analyze(program);
  if (options.o) {
    program = program.optimize();
  }
  if (options.a) {
    console.log(JSON.stringify(program, (key, value) => key === 'source' ? undefined : value, 2));
    return;
  }
  // if (argv.o) {
  //   program = program.optimize();
  // }
  // if (argv.i) {
  //   console.log(graphView(program));
  //   return;
  // }
  // program.gen();
}

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
