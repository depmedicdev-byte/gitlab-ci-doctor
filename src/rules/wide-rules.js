'use strict';

const { jobs, makeFinding } = require('../parse');

module.exports = {
  id: 'wide-rules',
  severity: 'info',
  category: 'cost',
  description: 'Jobs with no rules:/only:/except: and no workflow:rules run on every push, every MR, every schedule. Often unintended.',
  check(parsed) {
    const findings = [];
    const hasGlobalWorkflow = !!(parsed.data.workflow && parsed.data.workflow.rules);
    if (hasGlobalWorkflow) return findings;
    for (const { id, job } of jobs(parsed)) {
      if (job.rules !== undefined) continue;
      if (job.only !== undefined || job.except !== undefined) continue;
      if (job.trigger) continue;
      findings.push(
        makeFinding(
          module.exports,
          parsed,
          `Job '${id}' has no rules:, only:, except:, and the pipeline has no workflow:rules. It runs on every push and every MR. Add rules: to scope it.`,
          [id],
          {
            suggestion: 'rules:\n  - if: $CI_PIPELINE_SOURCE == "merge_request_event"\n  - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH',
            costImpact: 'medium',
          }
        )
      );
    }
    return findings;
  },
};
