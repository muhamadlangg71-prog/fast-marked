// fast-marked: a faster drop-in for marked 18.1.3 (marked.parse with
// defaults: gfm true, breaks false, pedantic false, async false).
//
// Strategy: keep marked's own parser (vendored in vendor/marked, byte
// identical to marked 18.1.3) and speed up its hot paths through its
// public tokenizer-extension API (fast.js). Any override that is unsure
// falls back to marked itself, so output stays byte-identical.

import { Marked } from './vendor/marked/marked.esm.js';
import { fastTokenizer } from './fast.js';

const marked = new Marked({ tokenizer: fastTokenizer });

export function parse(markdown) {
  return marked.parse(markdown);
}
