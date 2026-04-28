'use strict';

const { jobs, makeFinding } = require('../parse');

module.exports = {
  id: 'missing-timeout',
  severity: 'warn',
  category: 'cost',
  description: 'Jobs without timeout: default to the project setting (often 1h). A hung job drains shared-runner minutes you pay for.',
  check(parsed) {
    const findings = [];
    for (const { id, job } of jobs(parsed)) {
      if (job.timeout) continue;
      if (job.trigger) continue;
      findings.push(
        makeFinding(
          module.exports,
          parsed,
          `Job '${id}' defines no timeout. A runaway will burn the project default (often 1h, max 24h). Set a tight per-job cap.`,
          [id],
          { suggestion: 'timeout: 15 minutes', costImpact: 'high' }
        )
      );
    }
    return findings;
  },
};
