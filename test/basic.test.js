'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { auditPipeline, summarize, rules } = require('../src/index');

const demo = fs.readFileSync(path.join(__dirname, '..', 'examples', 'bad-gitlab-ci.yml'), 'utf8');

test('demo pipeline fires multiple rules', () => {
  const findings = auditPipeline(demo, 'examples/bad-gitlab-ci.yml');
  const ids = new Set(findings.map((f) => f.ruleId));
  assert.ok(ids.has('image-no-pin'), 'image-no-pin should fire on node:latest');
  assert.ok(ids.has('missing-cache'), 'missing-cache should fire on npm ci with no cache');
  assert.ok(ids.has('missing-interruptible'), 'missing-interruptible should fire on test');
  assert.ok(ids.has('missing-timeout'), 'missing-timeout should fire on every job');
  assert.ok(ids.has('expensive-runner'), 'expensive-runner should fire on saas-linux-2xlarge');
  assert.ok(ids.has('artifact-no-expiration'), 'artifact-no-expiration should fire on build');
  assert.ok(ids.has('deprecated-only-except'), 'deprecated-only-except should fire on test.only');
  assert.ok(ids.has('git-strategy-clone'), 'git-strategy-clone should fire on global GIT_STRATEGY');
  assert.ok(ids.has('parallel-overcommit'), 'parallel-overcommit should fire on parallel: 16');
  assert.ok(ids.has('missing-needs'), 'missing-needs should fire on later-stage jobs');
  assert.ok(ids.has('wide-rules'), 'wide-rules should fire when no workflow:rules');
  assert.ok(ids.has('include-no-pin'), 'include-no-pin should fire on remote include');
  const s = summarize(findings);
  assert.ok(s.warn + s.info > 0);
});

test('all rules have id, severity, description, check()', () => {
  for (const r of rules) {
    assert.ok(r.id);
    assert.ok(['error', 'warn', 'info'].includes(r.severity), `bad severity for ${r.id}`);
    assert.ok(r.description);
    assert.ok(typeof r.check === 'function');
  }
});

test('parse error returns single error finding', () => {
  const bad = 'image: node\n  bad: indent\nstages: [build, test\n';
  const findings = auditPipeline(bad);
  assert.ok(findings.some((f) => f.ruleId === 'parse-error'));
});
