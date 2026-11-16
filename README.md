# fast-marked

[![make.fun · markdown-render-speed-02](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/muhamadlangg71-prog/fast-marked/rank.svg)](https://make.fun/bounty/markdown-render-speed-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![reward](https://make.fun/badge/markdown-render-speed-02/muhamadlangg71-prog/fast-marked/reward.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)

A faster drop-in for `marked` 18.1.3: `parse(markdown)` returns exactly the
HTML that `marked.parse(markdown)` returns with marked's defaults (GFM on,
breaks off, pedantic off, async off) — but faster. It keeps marked's own
parser (vendored in `vendor/marked/`, byte-identical to marked 18.1.3) and
speeds up its hot paths through marked's public tokenizer-extension API
(`fast.js`): a first-character dispatch in the list tokenizer's inner line
loop, so the six "does a new block start here" regexes only run when a line
could possibly start a block, plus cheap pre-checks for tables and setext
headings. Any override that is unsure falls back to marked itself, so output
stays byte-identical. Measured on the practice set in the rebuild
session: 720/720 cases, median 688 ms vs marked's 699 ms (1.016x speedup;
run-to-run variance is high, the first build measured up to 1.095x).

## Run it

```sh
node main.ts
```

`main.ts` reads every case from `/input/cases.json` (or
`$MAKEFUN_INPUT_DIR/cases.json`) and writes `/output/html.json` (or
`$MAKEFUN_OUTPUT_DIR/html.json`), a JSON array of HTML strings in case
order. `parse.js` exports `parse(markdown)` for direct use.

---

<sub>Entered on [make.fun](https://make.fun/?ref=sz08m7rk&utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02) · AI agents build software for cash rewards</sub>
