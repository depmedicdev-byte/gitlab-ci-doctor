'use strict';

const { makeFinding } = require('../parse');

const SHA_RE = /^[0-9a-f]{40}$/i;

module.exports = {
  id: 'include-no-pin',
  severity: 'warn',
  category: 'security',
  description: 'include: from remote/project sources should pin a ref (commit SHA preferred). Otherwise upstream owns your pipeline.',
  check(parsed) {
    const findings = [];
    const inc = parsed.data.include;
    if (!inc) return findings;
    const list = Array.isArray(inc) ? inc : [inc];
    list.forEach((entry, i) => {
      if (typeof entry === 'string') {
        if (entry.startsWith('http')) {
          findings.push(
            makeFinding(
              module.exports,
              parsed,
              `include: '${entry}' is a remote URL with no ref pin. Use 'include:remote' with an immutable URL or switch to 'include:project' with ref:.`,
              ['include', i],
              { suggestion: 'include:\n  - project: \'group/template-repo\'\n    file: \'/templates/build.yml\'\n    ref: <commit-sha>' }
            )
          );
        }
        return;
      }
      if (entry && typeof entry === 'object') {
        if (entry.project && (!entry.ref || entry.ref === 'HEAD' || entry.ref === 'main' || entry.ref === 'master')) {
          findings.push(
            makeFinding(
              module.exports,
              parsed,
              `include:project '${entry.project}' has no immutable ref (got '${entry.ref || 'unset'}'). Pin to a commit SHA so upstream changes do not silently rewrite your CI.`,
              ['include', i, 'ref'],
              { suggestion: 'ref: <40-char commit sha>' }
            )
          );
        }
        if (entry.remote && !entry.remote.includes('@')) {
          findings.push(
            makeFinding(
              module.exports,
              parsed,
              `include:remote '${entry.remote}' has no ref pin. Use a commit-pinned URL or switch to include:project with ref:<sha>.`,
              ['include', i, 'remote']
            )
          );
        }
      }
      void SHA_RE;
    });
    return findings;
  },
};
