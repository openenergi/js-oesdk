const oeSdkAlarmDebug = require('debug')('oe-sdk-alarm');

const _alarmApi = {};
_alarmApi.init = (oeHttpApi, _logErrorMsgFunc) => {
  _alarmApi.oeHttpApi = oeHttpApi;
  _alarmApi._logErrorMsg = _logErrorMsgFunc;
};

_alarmApi.getAlarmsByScope = (entityCode) => {
  oeSdkAlarmDebug(`Retrieving alarms for scope: ${entityCode}`);
  const axiosConfig = {};
  axiosConfig.params = {
    expand_tags: true
  };
  axiosConfig.headers = _alarmApi.oeHttpApi.headers.headers;
  return _alarmApi.oeHttpApi.axios.get(`/alarms?by=scope&scope=${entityCode}`, axiosConfig)
    .then(httpResponse => {
      const alarmDetails = httpResponse.data;
      oeSdkAlarmDebug(`Returning alarm details for scope '${entityCode}'`);
      return alarmDetails;
    })
    .catch((err) => {
      _alarmApi._logErrorMsg(err, 'Retrieving alarm details from the OE API');
      throw err;
    });
};

_alarmApi.getAlarmsByCreator = () => {
  oeSdkAlarmDebug('Retrieving scope for creator');
  const axiosConfig = {};
  axiosConfig.params = {
    expand_tags: true
  };
  axiosConfig.headers = _alarmApi.oeHttpApi.headers.headers;
  return _alarmApi.oeHttpApi.axios.get('/alarms?by=creator', axiosConfig)
    .then(httpResponse => {
      const alarmDetails = httpResponse.data;
      oeSdkAlarmDebug('Returning alarms by creator');
      return alarmDetails;
    })
    .catch((err) => {
      _alarmApi._logErrorMsg(err, 'Retrieving alarm details from the OE API');
      throw err;
    });
};

module.exports = _alarmApi;
