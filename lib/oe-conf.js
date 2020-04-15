const _demandProfileApi = require('./api-routes/demand-profile-api');
const _historicalApi = require('./api-routes/historical-api');
const _metadataApi = require('./api-routes/metadata-api');
const _signalApi = require('./api-routes/signal-api');
const _alarmApi = require('./api-routes/alarm-api');

const oeConf = {};

oeConf.apiExtensions = [];
oeConf.apiExtensions.push({ fieldKey: 'demandProfiles', fieldValue: _demandProfileApi });
oeConf.apiExtensions.push({ fieldKey: 'historical', fieldValue: _historicalApi });
oeConf.apiExtensions.push({ fieldKey: 'metadata', fieldValue: _metadataApi });
oeConf.apiExtensions.push({ fieldKey: 'signal', fieldValue: _signalApi });
oeConf.apiExtensions.push({ fieldKey: 'alarm', fieldValue: _alarmApi });

module.exports = oeConf;
