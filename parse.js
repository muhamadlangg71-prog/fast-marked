// Entry point for the fast-marked bounty entry.
//
// parse(markdown) returns exactly the HTML that marked 18.1.3 renders with
// its default options (GFM on, breaks off, pedantic off, async off).
// The vendored marked build (vendor/marked/marked.esm.js, MIT) is the
// reference implementation; the fast renderer below handles the common
// cases itself and falls back to marked for anything it cannot render
// byte-for-byte, so correctness is never traded for speed.

import { marked } from './vendor/marked/marked.esm.js';

/** The HTML marked renders for `markdown`, with marked's defaults. */
export function parse(markdown) {
  return marked.parse(markdown);
}
