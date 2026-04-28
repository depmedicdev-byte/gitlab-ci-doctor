'use strict';

const { jobs, makeFinding } = require('../parse');

module.exports = {
  id: 'artifact-no-expiration',
  severity: 'warn',
  category: 'cost',
  description: 'artifacts: without expire_in: live forever (or per project default). Storage cost grows linearly with pipeline count.',
  check(parsed) {
    const findings = [];
    for (const { id, job } of jobs(parsed)) {
      if (!job.artifacts) continue;
      if (job.artifacts.expire_in) continue;
      findings.push(
        makeFinding(
          module.exports,
          parsed,
          `Job '${id}' uploads artifacts with no expire_in:. Storage cost compounds. Set a TTL.`,
          [id, 'artifacts'],
          { suggestion: 'artifacts:\n  expire_in: 1 week', costImpact: 'medium' }
        )
      );
    }
    return findings;
  },
};
