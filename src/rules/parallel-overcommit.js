'use strict';

const { jobs, makeFinding } = require('../parse');

const THRESHOLD = 8;

function fanout(parallel) {
  if (parallel == null) return 0;
  if (typeof parallel === 'number') return parallel;
  if (typeof parallel === 'object' && parallel.matrix) {
    let total = 0;
    for (const entry of parallel.matrix) {
      let prod = 1;
      for (const v of Object.values(entry)) {
        const n = Array.isArray(v) ? v.length : 1;
        prod *= Math.max(1, n);
      }
      total += prod;
    }
    return total;
  }
  return 0;
}

module.exports = {
  id: 'parallel-overcommit',
  severity: 'warn',
  category: 'cost',
  description: 'parallel: > 8 multiplies job minutes linearly. Worth a sanity check on the matrix axes.',
  check(parsed) {
    const findings = [];
    for (const { id, job } of jobs(parsed)) {
      const n = fanout(job.parallel);
      if (n > THRESHOLD) {
        findings.push(
          makeFinding(
            module.exports,
            parsed,
            `Job '${id}' fans out to ${n} parallel runs. Each is billed in full. Consider trimming the matrix or sharding tests at the script level instead.`,
            [id, 'parallel'],
            { suggestion: `parallel: ${THRESHOLD}    # or a smaller matrix:`, costImpact: 'high' }
          )
        );
      }
    }
    return findings;
  },
};
