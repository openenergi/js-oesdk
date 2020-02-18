const oeSdkSignalDebug = require('debug')('oe-sdk-signal');

const oeHelpers = require('../oe-helpers');

const _signalApi = {};
_signalApi.init = (oeHttpApi, _logErrorMsgFunc) => {
  _signalApi.oeHttpApi = oeHttpApi;
  _signalApi._logErrorMsg = _logErrorMsgFunc;
};

_signalApi.dispatchSignal = (signalContent) => {
  oeSdkSignalDebug(`Dispatching a signal for entity code: ${signalContent.target.entity}`);
  return _signalApi.oeHttpApi.axios.post('/signals', signalContent, _signalApi.oeHttpApi.headers)
    .then(httpResponse => {
      const signalContext = httpResponse.data;
      if (signalContext.correlation_id) {
        oeSdkSignalDebug(`The signal correlation ID of the signal being dispatched is: ${signalContext.correlation_id}\n`);
        return signalContext.correlation_id;
      }
      throw new Error(`There has been a problem with the signal dispatch, this is the response: ${JSON.stringify(signalContext)}`);
    })
    .catch((err) => {
      _signalApi._logErrorMsg(err, 'Dispatching a signal via the Signal API');
      throw err;
    });
};

_signalApi.dispatchProfile = (profile, signalType, dateStr) => {
  const signalContent = oeHelpers.mapProfileToSignalMessage(profile, signalType, dateStr);
  return _signalApi.dispatchSignal(signalContent)
    .catch((err) => {
      _signalApi._logErrorMsg(err, 'Dispatching a profile via the Signal API');
      throw err;
    });
};

module.exports = _signalApi;
