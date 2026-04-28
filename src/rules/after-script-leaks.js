'use strict';

const { jobs, makeFinding } = require('../parse');

const PATTERNS = [
  { re: /^\s*env\s*$/m, why: "'env' lists every environment variable, including masked secrets, into the job log." },
  { re: /\bprintenv\b/, why: "'printenv' prints every environment variable into the job log." },
  { re: /\bset\s+-x\b/, why: "'set -x' echoes every command, expanding $SECRET into the log." },
  { re: /echo\s+["']?\$\{?[A-Z][A-Z0-9_]*(SECRET|TOKEN|KEY|PASSWORD|PWD|API_?KEY|CI_JOB_TOKEN)\b/i, why: "echoing a $SECRET-named variable prints the secret in plain text." },
];

function joinScript(script) {
  if (typeof script === 'string') return script;
  if (Array.isArray(script)) return script.filter((x) => typeof x === 'string').join('\n');
  return '';
}

module.exports = {
  id: 'after-script-leaks',
  severity: 'warn',
  category: 'security',
  description: "after_script: contains env, printenv, set -x, or echo $SECRET. after_script runs even on cancellation and the output is visible in the job log.",
  check(parsed) {
    const findings = [];
    const inspect = (script, pathParts, scope) => {
      const text = joinScript(script);
      if (!text) return;
      const hit = PATTERNS.find((p) => p.re.test(text));
      if (!hit) return;
      findings.push(makeFinding(
        module.exports,
        parsed,
        `${scope} after_script ${hit.why}`,
        pathParts,
      ));
    };
    if (parsed.data && parsed.data.after_script) inspect(parsed.data.after_script, ['after_script'], 'Global');
    if (parsed.data && parsed.data.default && parsed.data.default.after_script) {
      inspect(parsed.data.default.after_script, ['default', 'after_script'], 'default');
    }
    for (const { id, job } of jobs(parsed)) {
      if (job.after_script) inspect(job.after_script, [id, 'after_script'], `Job '${id}'`);
    }
    return findings;
  },
};
