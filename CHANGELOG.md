# Changelog

## 0.2.0 - 2026-04-28

Adds 2 high-signal security rules. Now 14 rules total.

- **services-no-pin** (security) - `services:` entries (postgres / redis / mysql / etc.) not pinned to `@sha256:<digest>` or floating on `:latest`. Sister to `image-no-pin`.
- **after-script-leaks** (security) - `after_script:` contains `env`, `printenv`, `set -x`, or `echo $TOKEN`. `after_script` runs even on cancellation and is visible in the job log, so secret leaks here are sticky.

Browser bundle rebuilt. All 14 demo rules verified green.

## 0.1.0 - 2026-04-28

Initial release. Sister project to [`ci-doctor`](https://www.npmjs.com/package/ci-doctor).

Ships 12 rules for GitLab CI:

- `image-no-pin` (security)
- `missing-cache` (cost)
- `missing-interruptible` (cost)
- `missing-timeout` (cost)
- `expensive-runner` (cost)
- `artifact-no-expiration` (cost)
- `deprecated-only-except` (maintenance)
- `git-strategy-clone` (cost)
- `parallel-overcommit` (cost)
- `missing-needs` (speed)
- `wide-rules` (cost)
- `include-no-pin` (security)

CLI supports `--json`, `--markdown`, `--severity`, `--only`, `--disable`, and `--demo`.
