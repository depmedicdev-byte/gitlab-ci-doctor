'use strict';

module.exports = [
  require('./image-no-pin'),
  require('./missing-cache'),
  require('./missing-interruptible'),
  require('./missing-timeout'),
  require('./expensive-runner'),
  require('./artifact-no-expiration'),
  require('./deprecated-only-except'),
  require('./git-strategy-clone'),
  require('./parallel-overcommit'),
  require('./missing-needs'),
  require('./wide-rules'),
  require('./include-no-pin'),
];
