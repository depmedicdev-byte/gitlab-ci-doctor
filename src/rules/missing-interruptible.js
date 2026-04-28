'use strict';

const { jobs, makeFinding } = require('../parse');

module.exports = {
  id: 'missing-interruptible',
  severity: 'warn',
  category: 'cost',
  description: 'Jobs without interruptible: true keep running when a newer pipeline starts on the same MR. Wastes minutes on stale commits.',
  check(parsed) {
    const findings = [];
    const globalInterruptible = parsed.data.workflow && parsed.data.workflow['auto_cancel'];
    const defaultInterruptible = parsed.data.default && parsed.data.default.interruptible;
    if (defaultInterruptible || globalInterruptible) return findings;
    for (const { id, job } of jobs(parsed)) {
      if (job.interruptible) continue;
      if (job.stage === 'deploy' || job.stage === 'release' || job.stage === 'production') continue;
      findings.push(
        makeFinding(
          module.exports,
          parsed,
          `Job '${id}' has no interruptible: true. New pipeline pushes will not cancel its stale predecessor. Easy ~30%+ minutes savings on busy MRs.`,
          [id],
          { suggestion: 'interruptible: true', costImpact: 'high' }
        )
      );
    }
    return findings;
  },
};
