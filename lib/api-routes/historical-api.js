const oeSdkHistoricalDebug = require('debug')('oe-sdk-historical');
const moment = require('moment');

const MAX_LIMIT = 200000;

const _historicalApi = {};
_historicalApi.init = (oeHttpApi, _logErrorMsgFunc) => {
  _historicalApi.oeHttpApi = oeHttpApi;
  _historicalApi._logErrorMsg = _logErrorMsgFunc;
};

const _generateQueryParams = (entityCode, start, stop) => {
  const httpQp = {};
  httpQp.entity = entityCode;
  httpQp.limit = MAX_LIMIT;
  if (!start) {
    start = moment().clone().format('YYYY-MM-DDT00:00:00.000Z');
    oeSdkHistoricalDebug(`No 'start' input, so setting it to: ${start}`);
  } else {
    oeSdkHistoricalDebug(`The 'start' input: ${start}`);
  }
  httpQp.start = moment(start).clone().toISOString();
  oeSdkHistoricalDebug(`Using ISO formatted start datetime ${httpQp.start}`);
  if (!stop) {
    stop = moment(httpQp.start).clone().add(1, 'days').toISOString();
    oeSdkHistoricalDebug(`No 'stop' input, so setting it to: ${stop}`);
  } else {
    oeSdkHistoricalDebug(`The 'stop' input: ${stop}`);
  }
  httpQp.finish = moment(stop).clone().toISOString();
  oeSdkHistoricalDebug(`Using ISO formatted stop/finish datetime ${httpQp.finish}`);
  return httpQp;
};

_historicalApi.getRawReadings = (entityCode, variable, start, stop) => {
  const httpQp = _generateQueryParams(entityCode, start, stop);
  oeSdkHistoricalDebug(`Retrieving raw readings for variable '${variable}' and params: ${JSON.stringify(httpQp)}`);
  const axiosConfig = {};
  axiosConfig.params = httpQp;
  axiosConfig.headers = _historicalApi.oeHttpApi.headers.headers;
  return _historicalApi.oeHttpApi.axios.get(`/timeseries/historical/readings/points/${variable}/raw`, axiosConfig)
    .then(httpResponse => {
      const rawReadings = httpResponse.data.items;
      oeSdkHistoricalDebug(`Returning a list of raw readings with length ${rawReadings.length} for variable: ${variable}`);
      return rawReadings;
    })
    .catch((err) => {
      _historicalApi._logErrorMsg(err, 'Retrieving raw readings from the OE API');
      throw err;
    });
};

const _mapVariableToResamplingMethod = (variable, inResampling) => {
  let resampling;
  if (inResampling) {
    resampling = inResampling;
  } else if (variable === 'n2ex-forecast') {
    resampling = '1h';
  } else if (variable === 'baseline-forecast') {
    resampling = '30m';
  } else {
    // active-power, avail, resp etc
    resampling = '30m-compliance';
  }
  oeSdkHistoricalDebug(`The resampling method for variable '${variable}' is: '${resampling}'`);
  return resampling;
};

_historicalApi.getResampledReadings = (entityCode, variable, start, stop, resampling) => {
  resampling = _mapVariableToResamplingMethod(variable, resampling);
  const httpQp = _generateQueryParams(entityCode, start, stop);
  oeSdkHistoricalDebug(`Retrieving resampled readings for variable '${variable}', resampling method ${resampling} and params: ${JSON.stringify(httpQp)}`);
  const axiosConfig = {};
  axiosConfig.params = httpQp;
  axiosConfig.headers = _historicalApi.oeHttpApi.headers.headers;
  return _historicalApi.oeHttpApi.axios.get(`/timeseries/historical/readings/points/${variable}/resamplings/${resampling}`, axiosConfig)
    .then(httpResponse => {
      const resampledReadings = httpResponse.data.items;
      oeSdkHistoricalDebug(`Returning a list of resampled readings with length ${resampledReadings.length} for variable '${variable}' and resampling method '${resampling}'`);
      return resampledReadings;
    })
    .catch((err) => {
      _historicalApi._logErrorMsg(err, 'Retrieving resampled readings from the OE API');
      throw err;
    });
};

module.exports = _historicalApi;
