'use strict';

const { jobs, makeFinding } = require('../parse');

const SHA_RE = /@sha256:[a-f0-9]{64}$/i;

module.exports = {
  id: 'image-no-pin',
  severity: 'warn',
  category: 'security',
  description: 'image: should be pinned to a digest (@sha256:...) or at minimum a specific tag, not :latest or unspecified.',
  check(parsed) {
    const findings = [];
    const checkImage = (img, pathParts, scope) => {
      const name = typeof img === 'string' ? img : img && img.name;
      if (!name || typeof name !== 'string') return;
      if (SHA_RE.test(name)) return;
      const tagIdx = name.lastIndexOf(':');
      const slashIdx = name.lastIndexOf('/');
      const hasTag = tagIdx > slashIdx;
      const tag = hasTag ? name.slice(tagIdx + 1) : '';
      if (!hasTag || tag === 'latest' || tag === '') {
        findings.push(
          makeFinding(
            module.exports,
            parsed,
            `${scope} uses image '${name}' without a digest pin. ${!hasTag ? "No tag specified - defaults to ':latest'." : tag === 'latest' ? "Tag ':latest' is mutable." : ''} Pin to @sha256:... for reproducible, supply-chain-safe builds.`,
            pathParts,
            { suggestion: `image: ${name.split(':')[0]}@sha256:<digest>`, costImpact: 'low' }
          )
        );
      }
    };

    if (parsed.data.image) checkImage(parsed.data.image, ['image'], 'global image');
    if (parsed.data.default && parsed.data.default.image) {
      checkImage(parsed.data.default.image, ['default', 'image'], 'default.image');
    }
    for (const { id, job } of jobs(parsed)) {
      if (job.image) checkImage(job.image, [id, 'image'], `Job '${id}'`);
    }
    return findings;
  },
};
