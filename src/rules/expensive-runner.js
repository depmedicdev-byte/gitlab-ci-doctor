'use strict';

const { jobs, makeFinding } = require('../parse');

const EXPENSIVE_TAGS = [
  { tag: /^saas-linux-large-/, mult: '2x', alt: 'saas-linux-medium-amd64' },
  { tag: /^saas-linux-2xlarge-/, mult: '4x', alt: 'saas-linux-medium-amd64 or self-hosted runner' },
  { tag: /^saas-windows-/, mult: '2x', alt: 'saas-linux-medium-amd64 if your build does not strictly need Windows' },
  { tag: /^saas-macos-/, mult: '6x to 10x', alt: 'saas-linux-medium-amd64 if your build does not strictly need macOS' },
];

const PLATFORM_HINTS = [
  /\bbrew\b/,
  /\bcodesign\b/,
  /\bxcodebuild\b/,
  /\bxcrun\b/,
  /\bnotarytool\b/,
  /\bchocolatey\b/i,
  /\bchoco\s+install\b/i,
  /\bSet-ExecutionPolicy\b/i,
  /\bpowershell\s+-/i,
  /\bnuget\b/i,
  /\bmsbuild\b/i,
];

module.exports = {
  id: 'expensive-runner',
  severity: 'warn',
  category: 'cost',
  description: 'Large/Windows/macOS GitLab SaaS runners cost a multiple of the medium Linux runner. Use them only when the build actually needs them.',
  check(parsed) {
    const findings = [];
    for (const { id, job } of jobs(parsed)) {
      if (!job.tags) continue;
      const tags = Array.isArray(job.tags) ? job.tags : [job.tags];
      let match;
      for (const t of tags) {
        if (typeof t !== 'string') continue;
        match = EXPENSIVE_TAGS.find((e) => e.tag.test(t));
        if (match) break;
      }
      if (!match) continue;
      const scriptText = [job.before_script, job.script, job.after_script]
        .flat()
        .filter((s) => typeof s === 'string')
        .join('\n');
      if (PLATFORM_HINTS.some((re) => re.test(scriptText))) continue;
      findings.push(
        makeFinding(
          module.exports,
          parsed,
          `Job '${id}' uses tag(s) ${tags.join(', ')} (${match.mult} the price of medium Linux) but no platform-specific commands detected. Switch to '${match.alt}'.`,
          [id, 'tags'],
          { suggestion: `tags:\n  - ${match.alt}`, costImpact: 'high' }
        )
      );
    }
    return findings;
  },
};
