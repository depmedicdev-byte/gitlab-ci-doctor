'use strict';

const { jobs, makeFinding } = require('../parse');

module.exports = {
  id: 'deprecated-only-except',
  severity: 'info',
  category: 'maintenance',
  description: 'only:/except: are legacy. GitLab recommends rules: for all new pipelines (and they compose better with workflow:rules).',
  check(parsed) {
    const findings = [];
    for (const { id, job } of jobs(parsed)) {
      if (job.only !== undefined) {
        findings.push(
          makeFinding(
            module.exports,
            parsed,
            `Job '${id}' uses only:. Migrate to rules: for clearer composition with workflow: and pipeline triggers.`,
            [id, 'only'],
            { suggestion: 'rules:\n  - if: $CI_COMMIT_BRANCH == "main"' }
          )
        );
      }
      if (job.except !== undefined) {
        findings.push(
          makeFinding(
            module.exports,
            parsed,
            `Job '${id}' uses except:. Migrate to rules: with negative conditions for clearer composition.`,
            [id, 'except'],
            { suggestion: 'rules:\n  - if: $CI_COMMIT_BRANCH != "main"' }
          )
        );
      }
    }
    return findings;
  },
};
