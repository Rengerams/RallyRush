#!/usr/bin/env node
/**
 * scan_repo.js
 * Usage: node scan_repo.js <path> [--out report.json]
 *
 * Scans JS/TS/HTML files for common performance-risk patterns and prints a report.
 * Excludes node_modules, .git, dist, build, and typical vendor directories.
 */

const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';
const outArgIndex = process.argv.indexOf('--out');
const outFile = outArgIndex !== -1 ? process.argv[outArgIndex + 1] : null;

const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.html']);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', 'out']);

const patterns = [
  { key: 'setInterval', re: /\bsetInterval\s*\(/g, hint: 'Check frequency; clear timers on teardown; consider requestAnimationFrame for animations.' },
  { key: 'setTimeout', re: /\bsetTimeout\s*\(/g, hint: 'Avoid tight repeated timeouts; consider throttling/debouncing.' },
  { key: 'requestAnimationFrame', re: /\brequestAnimationFrame\s*\(/g, hint: 'Preferred for visual updates — ensure you cancel when not needed.' },
  { key: 'innerHTML', re: /\.innerHTML\b/g, hint: 'Replacing large subtrees can be expensive; prefer patching or DocumentFragment.' },
  { key: 'insertAdjacentHTML', re: /\binsertAdjacentHTML\s*\(/g, hint: 'Good for inserts but batch them via fragments where possible.' },
  { key: 'createElement', re: /\bcreateElement\s*\(/g, hint: 'Use DocumentFragment for many inserts.' },
  { key: 'appendChild', re: /\bappendChild\s*\(/g, hint: 'Batch DOM appends to minimize reflows.' },
  { key: 'querySelector', re: /\bquerySelector(All)?\s*\(/g, hint: 'Cache selectors instead of repeating in loops/handlers.' },
  { key: 'getElement', re: /\bgetElement(ById|ByClassName|ByTagName)\s*\(/g, hint: 'Prefer cached references or scoped queries.' },
  { key: 'addEventListener', re: /\baddEventListener\s*\(/g, hint: 'Use delegation; debounce/throttle handlers for scroll/resize.' },
  { key: 'fetch', re: /\bfetch\s*\(/g, hint: 'Avoid repeated identical fetches; add caching/debounce/batching.' },
  { key: 'XMLHttpRequest', re: /\bXMLHttpRequest\b/g, hint: 'Prefer fetch and async patterns; avoid synchronous XHR.' },
  { key: 'axios', re: /\baxios\./g, hint: 'Check for many repeated requests; consider batching/caching.' },
  { key: 'localStorage', re: /\blocalStorage\b/g, hint: 'LocalStorage is sync — avoid heavy reads/writes during UI events.' },
  { key: 'sessionStorage', re: /\bsessionStorage\b/g, hint: 'Same caution as localStorage.' },
  { key: 'indexedDB', re: /\bindexedDB\b/ig, hint: 'IndexedDB is async — good for large data instead of localStorage.' },
  { key: 'JSON', re: /\bJSON\.(parse|stringify)\s*\(/g, hint: 'Large JSON parse/stringify may block — consider streaming or Web Worker.' },
  { key: 'loops', re: /\bfor\s*\(|\bwhile\s*\(/g, hint: 'Heavy synchronous loops can freeze UI; consider chunking or Web Worker.' },
  { key: 'inline-on*', re: /\bon[a-zA-Z]+\s*=/g, hint: 'Inline event handlers may be harder to manage; check for many inline handlers.' }
];

function isExcludedDir(name) {
  return EXCLUDE_DIRS.has(name);
}

async function walk(dir, fileCallback) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (isExcludedDir(e.name)) continue;
      await walk(path.join(dir, e.name), fileCallback);
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (EXTS.has(ext) || e.name.endsWith('.html')) {
        await fileCallback(path.join(dir, e.name));
      }
    }
  }
}

function indexToLineCol(content, idx) {
  const before = content.slice(0, idx);
  const lines = before.split(/\r?\n/);
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

async function scanFile(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8').catch(() => null);
  if (content === null) return [];
  const results = [];
  for (const p of patterns) {
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(content)) !== null) {
      const idx = m.index;
      const { line, col } = indexToLineCol(content, idx);
      // capture surrounding snippet up to line
      const lines = content.split(/\r?\n/);
      const snippet = lines[line - 1].trim();
      results.push({
        file: filePath,
        pattern: p.key,
        hint: p.hint,
        match: m[0],
        line,
        col,
        snippet
      });
      // Prevent infinite loops for zero-length matches
      if (p.re.lastIndex === idx) p.re.lastIndex++;
    }
  }
  return results;
}

(async function main() {
  console.log(`Scanning ${root} ... (this may take a moment)`);
  const allMatches = [];
  await walk(root, async (filePath) => {
    const rel = path.relative(process.cwd(), filePath);
    const matches = await scanFile(filePath);
    for (const m of matches) {
      m.file = rel;
      allMatches.push(m);
    }
  });

  if (allMatches.length === 0) {
    console.log('No pattern matches found (in scanned file types).');
  } else {
    // Group by file for a readable report
    const byFile = {};
    for (const m of allMatches) {
      byFile[m.file] = byFile[m.file] || [];
      byFile[m.file].push(m);
    }
    for (const f of Object.keys(byFile).sort()) {
      console.log(`\nFile: ${f}`);
      for (const m of byFile[f]) {
        console.log(`  [${m.pattern}] L${m.line}:${m.col} -> ${m.snippet}`);
      }
    }
    console.log(`\nTotal matches: ${allMatches.length}`);
  }

  if (outFile) {
    try {
      await fs.promises.writeFile(outFile, JSON.stringify(allMatches, null, 2), 'utf8');
      console.log(`Wrote JSON report to ${outFile}`);
    } catch (err) {
      console.error('Failed to write output file:', err.message);
    }
  }
})().catch((error) => {
  console.error('Repository scan failed:', error);
  process.exitCode = 1;
});
