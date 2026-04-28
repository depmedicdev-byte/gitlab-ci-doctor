# gitlab-ci-doctor

Audit `.gitlab-ci.yml` for waste, cost leaks, and security gaps.
Sister project to [`ci-doctor`](https://www.npmjs.com/package/ci-doctor)
(GitHub Actions). Same engine, same opinions, GitLab-native rules.

```bash
npx gitlab-ci-doctor                  # audit current repo
npx gitlab-ci-doctor --markdown       # MR-comment friendly
npx gitlab-ci-doctor --json           # machine-readable
npx gitlab-ci-doctor --severity=warn  # warn + error only
npx gitlab-ci-doctor --rules          # list checks
npx gitlab-ci-doctor --demo           # smoke-test against bundled bad pipeline
```

Exit code is `1` when there are error-level findings, so it drops into a
GitLab CI job (or a pre-commit hook) without ceremony.

## What it catches

| Rule | Severity | Why it matters |
| --- | --- | --- |
| `image-no-pin` | warn | `:latest` and bare image names are mutable; pin a digest. |
| `missing-cache` | warn | npm/pip/gradle/cargo etc. without `cache:` re-download every run. |
| `missing-interruptible` | warn | Stale pipelines on superseded MR commits keep burning minutes. |
| `missing-timeout` | warn | A hung job runs to the project default (often 1h, max 24h). |
| `expensive-runner` | warn | `saas-linux-large/2xlarge`, `saas-windows`, `saas-macos` cost 2x to 10x. |
| `artifact-no-expiration` | warn | `artifacts:` without `expire_in:` accumulate storage cost. |
| `deprecated-only-except` | info | Migrate to `rules:` (composes with `workflow:rules`). |
| `git-strategy-clone` | warn | `clone` re-fetches full history every job; prefer `fetch` + `GIT_DEPTH`. |
| `parallel-overcommit` | warn | `parallel: > 8` multiplies job minutes; sanity-check the matrix. |
| `missing-needs` | info | Stages without `needs:` block on the entire previous stage. |
| `wide-rules` | info | No `rules:` and no `workflow:rules` runs on every push and every MR. |
| `include-no-pin` | warn | Remote/project includes without an immutable ref give upstream control of your pipeline. |

## CI usage (GitLab native)

```yaml
ci-doctor:
  stage: lint
  image: node:22-alpine
  interruptible: true
  cache:
    key: "$CI_COMMIT_REF_SLUG-npx"
    paths:
      - .npm/
  script:
    - npx --yes gitlab-ci-doctor --markdown > ci-doctor.md
    - cat ci-doctor.md
  artifacts:
    when: always
    paths:
      - ci-doctor.md
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Programmatic use

```js
const { auditPipeline, summarize } = require('gitlab-ci-doctor');
const fs = require('node:fs');

const findings = auditPipeline(fs.readFileSync('.gitlab-ci.yml', 'utf8'), '.gitlab-ci.yml');
console.log(summarize(findings));
```

## License

MIT. PRs welcome.
