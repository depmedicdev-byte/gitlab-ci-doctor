'use strict';

const { jobs, makeFinding } = require('../parse');

const SHA_RE = /@sha256:[a-f0-9]{64}$/i;

function nameOf(svc) {
  if (typeof svc === 'string') return svc;
  if (svc && typeof svc === 'object' && typeof svc.name === 'string') return svc.name;
  return null;
}

function isUnpinned(name) {
  if (!name || typeof name !== 'string') return false;
  if (SHA_RE.test(name)) return false;
  const tagIdx = name.lastIndexOf(':');
  const slashIdx = name.lastIndexOf('/');
  const hasTag = tagIdx > slashIdx;
  if (!hasTag) return true;
  const tag = name.slice(tagIdx + 1);
  return tag === 'latest';
}

module.exports = {
  id: 'services-no-pin',
  severity: 'warn',
  category: 'security',
  description: 'services: entries should be pinned to @sha256:<digest>. Floating tags or :latest break reproducibility and are a supply-chain risk.',
  check(parsed) {
    const findings = [];
    const checkList = (services, pathParts, scope) => {
      if (!Array.isArray(services)) return;
      for (let i = 0; i < services.length; i++) {
        const name = nameOf(services[i]);
        if (!isUnpinned(name)) continue;
        findings.push(makeFinding(
          module.exports,
          parsed,
          `${scope} service[${i}] '${name}' is not pinned to a digest. Pin to @sha256:... for reproducible, supply-chain-safe builds.`,
          [...pathParts, i],
          { suggestion: `${name.split(':')[0]}@sha256:<digest>` }
        ));
      }
    };
    if (parsed.data && parsed.data.services) checkList(parsed.data.services, ['services'], 'global');
    if (parsed.data && parsed.data.default && parsed.data.default.services) {
      checkList(parsed.data.default.services, ['default', 'services'], 'default');
    }
    for (const { id, job } of jobs(parsed)) {
      if (job.services) checkList(job.services, [id, 'services'], `Job '${id}'`);
    }
    return findings;
  },
};
