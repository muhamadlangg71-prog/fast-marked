// Fast tokenizer overrides for the fast-marked entry.
//
// These plug into marked through its public `use({ tokenizer })` API: a
// function that returns `false` falls back to marked's own implementation,
// and one that returns `undefined` means "no token here". Every override
// below either reproduces marked's result exactly or declines (returning
// `false` / `undefined`) so marked decides. Nothing here changes output,
// only how fast it is produced.
//
// The overrides:
//  - list: marked's list tokenizer, with a first-character dispatch in its
//    inner line loop so the six "does a new block start here" regexes only
//    run when the line could possibly start one.
//  - table: a cheap pre-check (the delimiter row must look like one) before
//    marked's table regex runs.
//  - lheading: a cheap pre-check (a setext underline must appear before the
//    paragraph ends) before marked's setext regex runs.

/** Expand tabs to spaces, tab stops every 4 columns starting at column `col`. */
function expandTabs(s, col = 0) {
  let n = '';
  let t = col;
  for (const ch of s) {
    if (ch === '\t') {
      const r = 4 - (t % 4);
      n += ' '.repeat(r);
      t += r;
    } else {
      n += ch;
      t++;
    }
  }
  return n;
}

/** Can a line whose first non-space char is `c` start a new block? */
function canStartBlock(line) {
  let i = 0;
  while (i < line.length && line.charCodeAt(i) === 32) i++;
  if (i >= line.length) return false;
  const c = line.charCodeAt(i);
  return (
    c === 96 || // `
    c === 126 || // ~
    c === 35 || // #
    c === 60 || // <
    c === 62 || // >
    c === 42 || // *
    c === 45 || // -
    c === 43 || // +
    c === 95 || // _
    (c >= 48 && c <= 57) // digit
  );
}

/**
 * marked's list tokenizer, with a first-character dispatch in the inner
 * line loop. The six "does a new block start here" regexes (fences,
 * heading, html, blockquote, next bullet, hr) all begin with `^ {0,R}`
 * followed by a marker character, so when a line's first non-space
 * character cannot be a marker, none of them can match and they are skipped.
 * Everything else is marked's logic unchanged.
 */
function fastList(e) {
  // A list item starts with up to 3 spaces, then -, *, +, or a digit.
  const c0 = firstAfterSpaces(e);
  if (c0 !== 45 && c0 !== 42 && c0 !== 43 && !(c0 >= 48 && c0 <= 57)) {
    return undefined;
  }
  let t = this.rules.block.list.exec(e);
  if (!t) return undefined;
  const n = e;
  const s = () => n.length - e.length;
  let r = t[1].trim();
  const o = r.length > 1;
  const i = {
    type: 'list',
    raw: '',
    ordered: o,
    start: o ? +r.slice(0, -1) : '',
    loose: false,
    items: [],
  };
  r = o ? `\\d{1,9}\\${r.slice(-1)}` : `\\${r}`;
  if (this.options.pedantic) r = o ? r : '[*+-]';
  const l = this.rules.other.listItemRegex(r);
  let p = false;
  for (; e; ) {
    let u = false;
    let d = '';
    if (!(t = l.exec(e)) || this.rules.block.hr.test(e)) break;
    const k = s();
    e = e.substring(t[0].length);
    const g = t[2].split('\n', 1)[0];
    const b = t[1].length;
    let m = this.options.pedantic
      ? expandTabs(g, b)
      : g.replace(this.rules.other.leadingSpaceTab, (v) => expandTabs(v, b));
    let f = e.split('\n', 1)[0];
    let y = !m.trim();
    let R = 0;
    if (this.options.pedantic) {
      R = 2;
      d = m.trimStart();
    } else if (y) {
      R = b + 1;
    } else {
      R = m.search(this.rules.other.nonSpaceChar);
      if (R > 4) R = 1;
      d = m.slice(R);
      R += b;
    }
    if (y && this.rules.other.blankLine.test(f)) {
      e = e.substring(f.length + 1);
      u = true;
    }
    if (!u) {
      const v = this.rules.other.nextBulletRegex(R);
      const Q = this.rules.other.hrRegex(R);
      const ee = this.rules.other.fencesBeginRegex(R);
      const te = this.options.pedantic
        ? this.rules.other.pedanticHeadingBeginRegex(R)
        : this.rules.other.headingBeginRegex(R);
      const M = this.rules.other.htmlBeginRegex(R);
      const ne = this.rules.other.blockquoteBeginRegex(R);
      for (; e; ) {
        const U = e.split('\n', 1)[0];
        let Z;
        f = U;
        if (this.options.pedantic) {
          f = f.replace(this.rules.other.listReplaceNesting, '  ');
          Z = f;
        } else {
          Z = f.replace(this.rules.other.leadingSpaceTab, (me) => expandTabs(me));
        }
        if (
          canStartBlock(f) &&
          (ee.test(f) || te.test(f) || M.test(f) || ne.test(f) || v.test(f) || Q.test(f))
        ) {
          break;
        }
        if (Z.search(this.rules.other.nonSpaceChar) >= R || !f.trim()) {
          d += '\n' + Z.slice(R);
        } else {
          if (
            y ||
            m.replace(this.rules.other.tabCharGlobal, '    ').search(this.rules.other.nonSpaceChar) >= 4 ||
            (canStartBlock(m) && (ee.test(m) || te.test(m) || M.test(m) || Q.test(m)))
          ) {
            break;
          }
          const qe =
            !this.options.pedantic &&
            /^ {0,3}(?:=+|-+) *$/.test(f) &&
            this.rules.block.lheading.test(`${m}\n${f}`)
              ? `    ${Z.replace(/^ {0,3}/, '')}`
              : f;
          d += '\n' + qe;
        }
        y = !f.trim();
        e = e.substring(U.length + 1);
        m = Z.slice(R);
      }
    }
    const A = n.slice(k, s());
    if (!i.loose) {
      if (p) i.loose = true;
      else if (this.rules.other.doubleBlankLine.test(A)) p = true;
    }
    i.items.push({
      type: 'list_item',
      raw: A,
      task: !!this.options.gfm && this.rules.other.listIsTask.test(d),
      loose: false,
      text: d,
      tokens: [],
    });
  }
  const h = i.items.at(-1);
  if (h) {
    h.raw = h.raw.trimEnd();
    h.text = h.text.trimEnd();
  } else {
    return undefined;
  }
  i.raw = n.slice(0, s()).trimEnd();
  for (const u of i.items) {
    this.lexer.state.top = false;
    u.tokens = this.lexer.blockTokens(u.text, []);
    if (!i.loose) {
      const d = u.tokens.filter((g) => g.type === 'space');
      const k = d.length > 0 && d.some((g) => this.rules.other.anyLine.test(g.raw));
      i.loose = k;
    }
  }
  for (const u of i.items) {
    const d = u.tokens[0];
    if (u.task && (d?.type === 'text' || d?.type === 'paragraph')) {
      u.text = u.text.replace(this.rules.other.listReplaceTask, '');
      d.raw = d.raw.replace(this.rules.other.listReplaceTask, '');
      d.text = d.text.replace(this.rules.other.listReplaceTask, '');
      for (let g = this.lexer.inlineQueue.length - 1; g >= 0; g--) {
        if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[g].src)) {
          this.lexer.inlineQueue[g].src = this.lexer.inlineQueue[g].src.replace(
            this.rules.other.listReplaceTask,
            '',
          );
          break;
        }
      }
      const k = this.rules.other.listTaskCheckbox.exec(u.raw);
      if (k) {
        const g = {
          type: 'checkbox',
          raw: k[0] + ' ',
          checked: k[0] !== '[ ]',
        };
        u.checked = g.checked;
        if (i.loose) {
          if (
            u.tokens[0] &&
            ['paragraph', 'text'].includes(u.tokens[0].type) &&
            'tokens' in u.tokens[0] &&
            u.tokens[0].tokens
          ) {
            u.tokens[0].raw = g.raw + u.tokens[0].raw;
            u.tokens[0].text = g.raw + u.tokens[0].text;
            u.tokens[0].tokens.unshift(g);
          } else {
            u.tokens.unshift({
              type: 'paragraph',
              raw: g.raw,
              text: g.raw,
              tokens: [g],
            });
          }
        } else {
          u.tokens.unshift(g);
        }
      }
    } else if (u.task) {
      u.task = false;
    }
  }
  if (i.loose) {
    for (const u of i.items) {
      u.loose = true;
      for (const d of u.tokens) if (d.type === 'text') d.type = 'paragraph';
    }
  }
  return i;
}

/**
 * Table pre-check: the delimiter row (the line right after the header)
 * must consist only of `|`, `-`, `:` and spaces/tabs, with at least one
 * `-`. Otherwise no table can start here; return undefined so the block
 * loop moves on. Otherwise return false so marked's own table runs.
 */function fastTable(e) {
  const nl = e.indexOf('\n');
  if (nl === -1) return undefined;
  const nl2 = e.indexOf('\n', nl + 1);
  const line = nl2 === -1 ? e.slice(nl + 1) : e.slice(nl + 1, nl2);
  let dash = false;
  for (let j = 0; j < line.length; j++) {
    const c = line.charCodeAt(j);
    if (c === 45) {
      dash = true;
    } else if (c === 124 || c === 58 || c === 32 || c === 9) {
      // | : space tab — allowed in a delimiter row
    } else {
      return undefined;
    }
  }
  if (!dash) return undefined;
  return false;
}

/**
 * Setext-heading pre-check: a setext underline (a line of only `=` or `-`,
 * up to 3 spaces indented) must appear before the paragraph ends (first
 * blank line). Otherwise no setext heading can start here.
 */
function fastLheading(e) {
  const blank = e.search(/\n[ \t]*\n/);
  const head = blank === -1 ? e : e.slice(0, blank + 1);
  if (!/\n {0,3}[=-]/.test(head)) return undefined;
  return false;
}

/** First non-space char code after skipping up to 3 leading spaces, or -1. */
function firstAfterSpaces(e) {
  let i = 0;
  while (i < 3 && i < e.length && e.charCodeAt(i) === 32) i++;
  return i < e.length ? e.charCodeAt(i) : -1;
}

/** Block pre-check factory: only run the original when the first char can start it. */
function skipIfNot(markers) {
  return (e) => {
    const c = firstAfterSpaces(e);
    return markers.indexOf(c) !== -1 ? false : undefined;
  };
}

// Block tokenizers, first-character pre-checks. Each returns false ("let
// marked decide") when the block could start here, undefined otherwise.
// All of marked's block regexes start with `^ {0,3}` + a marker char.
function fastSpace(e) {
  const c = e.charCodeAt(0);
  return c === 32 || c === 9 || c === 10 ? false : undefined;
}
function fastCode(e) {
  const c = e.charCodeAt(0);
  return c === 32 || c === 9 ? false : undefined;
}
const fastFences = skipIfNot([96, 126]); // ` ~
const fastHeading = skipIfNot([35]); // #
const fastHr = skipIfNot([45, 42, 95]); // - * _
const fastBlockquote = skipIfNot([62]); // >
const fastHtml = skipIfNot([60]); // <
const fastDef = skipIfNot([91]); // [

/** Tokenizer overrides to hand to marked through `use({ tokenizer })`. */
export const fastTokenizer = {
  space: fastSpace,
  code: fastCode,
  fences: fastFences,
  heading: fastHeading,
  hr: fastHr,
  blockquote: fastBlockquote,
  list: fastList,
  html: fastHtml,
  def: fastDef,
  table: fastTable,
  lheading: fastLheading,
};
