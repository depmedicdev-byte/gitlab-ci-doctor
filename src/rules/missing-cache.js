'use strict';

const { jobs, makeFinding } = require('../parse');

const INSTALL_HINTS = [
  { re: /\bnpm (ci|install)\b/, eco: 'node_modules', tip: "key: \"$CI_COMMIT_REF_SLUG\"\npaths:\n  - node_modules/" },
  { re: /\byarn install\b/, eco: 'node_modules', tip: "key: \"$CI_COMMIT_REF_SLUG\"\npaths:\n  - node_modules/" },
  { re: /\bpnpm install\b/, eco: '.pnpm-store', tip: "key: \"$CI_COMMIT_REF_SLUG\"\npaths:\n  - .pnpm-store/" },
  { re: /\bpip install\b/, eco: '.cache/pip', tip: "key: \"$CI_COMMIT_REF_SLUG\"\npaths:\n  - .cache/pip/\n  - venv/" },
  { re: /\bpoetry install\b/, eco: '.cache/pypoetry', tip: "key: \"$CI_COMMIT_REF_SLUG\"\npaths:\n  - .cache/pypoetry/" },
  { re: /\bgradle\b|\.\/gradlew/, eco: '.gradle/caches', tip: "key: \"$CI_COMMIT_REF_SLUG\"\npaths:\n  - .gradle/caches/\n  - .gradle/wrapper/" },
  { re: /\bmvn /, eco: '.m2/repository', tip: "key: \"$CI_COMMIT_REF_SLUG\"\npaths:\n  - .m2/repository/" },
  { re: /\bgo (build|test|mod)\b/, eco: 'go-build', tip: "key: \"$CI_COMMIT_REF_SLUG\"\npaths:\n  - .cache/go-build/\n  - go/pkg/mod/" },
  { re: /\bcargo (build|test)\b/, eco: 'target', tip: "key: \"$CI_COMMIT_REF_SLUG\"\npaths:\n  - .cargo/\n  - target/" },
  { re: /\bbundle install\b/, eco: 'vendor/bundle', tip: "key: \"$CI_COMMIT_REF_SLUG\"\npaths:\n  - vendor/bundle/" },
];

module.exports = {
  id: 'missing-cache',
  severity: 'warn',
  category: 'cost',
  description: 'Jobs that run package installs (npm, pip, gradle, etc.) without a cache: block re-download deps every run.',
  check(parsed) {
    const findings = [];
    const globalCache = parsed.data.cache || (parsed.data.default && parsed.data.default.cache);
    for (const { id, job } of jobs(parsed)) {
      if (job.cache) continue;
      if (globalCache) continue;
      const scriptText = [job.before_script, job.script, job.after_script]
        .flat()
        .filter((s) => typeof s === 'string')
        .join('\n');
      if (!scriptText) continue;
      const hit = INSTALL_HINTS.find((h) => h.re.test(scriptText));
      if (!hit) continue;
      findings.push(
        makeFinding(
          module.exports,
          parsed,
          `Job '${id}' runs '${hit.re.source}' but defines no cache:. Each pipeline re-downloads ${hit.eco}. Adds 30-90s/job and bandwidth cost.`,
          [id],
          { suggestion: `cache:\n  ${hit.tip.replace(/\n/g, '\n  ')}`, costImpact: 'high' }
        )
      );
    }
    return findings;
  },
};
