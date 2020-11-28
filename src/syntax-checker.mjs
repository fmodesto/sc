import { readFileSync } from 'fs';
import ohm from 'ohm-js';

const grammar = ohm.grammar(readFileSync('src/simple.ohm'));

export default text => grammar.match(text).succeeded();
