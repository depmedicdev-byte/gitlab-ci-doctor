# Changelog

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
