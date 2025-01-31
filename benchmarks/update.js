const async = require('async')
const commonUtilities = require('./commonUtilities')
const Profiler = require('./profiler')

const benchDb = 'workspace/update.bench.db'
const profiler = new Profiler('UPDATE BENCH')
const config = commonUtilities.getConfiguration(benchDb)
const d = config.d
const n = config.n

async.waterfall([
  async.apply(commonUtilities.prepareDb, benchDb),
  function (cb) {
    d.loadDatabase(function (err) {
      if (err) { return cb(err) }
      if (config.program.withIndex) { d.ensureIndex({ fieldName: 'docNumber' }) }
      cb()
    })
  },
  function (cb) { profiler.beginProfiling(); return cb() },
  async.apply(commonUtilities.insertDocs, d, n, profiler),

  // Test with update only one document
  function (cb) { profiler.step('MULTI: FALSE'); return cb() },
  async.apply(commonUtilities.updateDocs, { multi: false }, d, n, profiler),

  // Test with multiple documents
  // eslint-disable-next-line node/handle-callback-err
  function (cb) { d.remove({}, { multi: true }, function (err) { return cb() }) },
  async.apply(commonUtilities.insertDocs, d, n, profiler),
  function (cb) { profiler.step('MULTI: TRUE'); return cb() },
  async.apply(commonUtilities.updateDocs, { multi: true }, d, n, profiler)
], function (err) {
  profiler.step('Benchmark finished')

  if (err) { return console.log('An error was encountered: ', err) }
})
