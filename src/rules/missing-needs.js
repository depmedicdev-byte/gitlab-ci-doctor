'use strict';

const { jobs, makeFinding } = require('../parse');

module.exports = {
  id: 'missing-needs',
  severity: 'info',
  category: 'speed',
  description: 'Jobs in stages > 1 without explicit needs: wait for the entire previous stage. needs: enables DAG-style parallelism.',
  check(parsed) {
    const findings = [];
    const stages = Array.isArray(parsed.data.stages) ? parsed.data.stages : null;
    if (!stages || stages.length < 2) return findings;
    const firstStage = stages[0];
    for (const { id, job } of jobs(parsed)) {
      if (!job.stage || job.stage === firstStage) continue;
      if (job.needs !== undefined) continue;
      if (job.trigger) continue;
      findings.push(
        makeFinding(
          module.exports,
          parsed,
          `Job '${id}' is in stage '${job.stage}' with no needs:. It blocks on every job in '${stages[stages.indexOf(job.stage) - 1] || 'previous stage'}'. Add needs: [<job-list>] for DAG parallelism.`,
          [id],
          { suggestion: `needs:\n  - <upstream-job-id>` }
        )
      );
    }
    return findings;
  },
};
