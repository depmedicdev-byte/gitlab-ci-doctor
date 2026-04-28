'use strict';

const { jobs, makeFinding } = require('../parse');

function getVar(scope, key) {
  if (!scope || !scope.variables) return undefined;
  return scope.variables[key];
}

module.exports = {
  id: 'git-strategy-clone',
  severity: 'warn',
  category: 'cost',
  description: "GIT_STRATEGY: clone or unset GIT_DEPTH wastes bandwidth. 'fetch' + a small GIT_DEPTH speeds most jobs.",
  check(parsed) {
    const findings = [];
    const globalStrategy = getVar(parsed.data, 'GIT_STRATEGY') || (parsed.data.default && getVar(parsed.data.default, 'GIT_STRATEGY'));
    const globalDepth = getVar(parsed.data, 'GIT_DEPTH') || (parsed.data.default && getVar(parsed.data.default, 'GIT_DEPTH'));

    if (String(globalStrategy) === 'clone') {
      findings.push(
        makeFinding(
          module.exports,
          parsed,
          `Global GIT_STRATEGY is 'clone' - every job re-clones from scratch. Use 'fetch' (default in modern runners) unless you have a specific reason.`,
          ['variables', 'GIT_STRATEGY'],
          { suggestion: "variables:\n  GIT_STRATEGY: fetch\n  GIT_DEPTH: \"20\"", costImpact: 'medium' }
        )
      );
    }
    if (globalDepth === undefined || String(globalDepth) === '0') {
      findings.push(
        makeFinding(
          module.exports,
          parsed,
          `GIT_DEPTH is unset or 0 - full history is fetched on every job. Set a small depth (e.g. 20) unless you need full history.`,
          ['variables'],
          { suggestion: 'variables:\n  GIT_DEPTH: "20"', costImpact: 'medium' }
        )
      );
    }

    for (const { id, job } of jobs(parsed)) {
      const s = getVar(job, 'GIT_STRATEGY');
      if (String(s) === 'clone') {
        findings.push(
          makeFinding(
            module.exports,
            parsed,
            `Job '${id}' overrides GIT_STRATEGY to 'clone'. Confirm this is required; 'fetch' is faster.`,
            [id, 'variables', 'GIT_STRATEGY'],
            { suggestion: 'GIT_STRATEGY: fetch' }
          )
        );
      }
    }
    return findings;
  },
};
