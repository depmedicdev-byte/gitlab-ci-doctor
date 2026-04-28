'use strict';

const YAML = require('yaml');

const RESERVED_KEYS = new Set([
  'default',
  'include',
  'stages',
  'variables',
  'workflow',
  'image',
  'services',
  'cache',
  'before_script',
  'after_script',
  'pages',
  'spec',
]);

function parseGitlabCi(source, filename) {
  const lineCounter = new YAML.LineCounter();
  const doc = YAML.parseDocument(source, { keepSourceTokens: true, lineCounter });
  doc.lineCounter = lineCounter;
  const errors = doc.errors.map((e) => ({
    severity: 'error',
    ruleId: 'parse-error',
    message: e.message,
    line: e.linePos ? e.linePos[0].line : 1,
    column: e.linePos ? e.linePos[0].col : 1,
    filename,
  }));
  const data = doc.toJS({ maxAliasCount: -1 }) || {};
  return { doc, data, errors, filename };
}

function jobs(parsed) {
  const out = [];
  for (const [id, body] of Object.entries(parsed.data || {})) {
    if (RESERVED_KEYS.has(id)) continue;
    if (id.startsWith('.')) continue;
    if (!body || typeof body !== 'object') continue;
    out.push({ id, job: body });
  }
  return out;
}

function nodeAt(doc, pathParts) {
  let node = doc.contents;
  for (const part of pathParts) {
    if (!node) return null;
    if (typeof part === 'number' && node.items) {
      node = node.items[part];
    } else if (node.items) {
      const pair = node.items.find((p) => p.key && (p.key.value === part || p.key.source === part));
      node = pair ? pair.value : null;
    } else {
      return null;
    }
  }
  return node;
}

function lineOf(doc, pathParts) {
  const node = nodeAt(doc, pathParts);
  if (!node || !node.range) return { line: 1, column: 1 };
  const lc = doc.lineCounter ? doc.lineCounter.linePos(node.range[0]) : null;
  if (lc) return { line: lc.line, column: lc.col };
  return { line: 1, column: 1 };
}

function makeFinding(rule, parsed, message, pathParts, extras = {}) {
  const p = lineOf(parsed.doc, pathParts);
  return {
    ruleId: rule.id,
    severity: rule.severity,
    message,
    line: p.line,
    column: p.column,
    filename: parsed.filename,
    ...extras,
  };
}

module.exports = { parseGitlabCi, jobs, nodeAt, lineOf, makeFinding, RESERVED_KEYS };
