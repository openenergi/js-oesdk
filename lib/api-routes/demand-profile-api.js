const oeSdkDemandDebug = require('debug')('oe-sdk-demand');
const moment = require('moment');

const _demandProfileApi = {};
_demandProfileApi.init = (oeHttpApi, _logErrorMsgFunc) => {
  _demandProfileApi.oeHttpApi = oeHttpApi;
  _demandProfileApi._logErrorMsg = _logErrorMsgFunc;
};

const _getProfile = (oeEntityCode, targetDateStr, profileType, metricName) => {
  if (!targetDateStr) {
    targetDateStr = moment().clone().format('YYYY-MM-DD');
    oeSdkDemandDebug(`Assuming we want to retrive an active profile for today: '${targetDateStr}'`);
  }
  oeSdkDemandDebug(`Retrieving a profile for entity code '${oeEntityCode}' and target date '${targetDateStr}' (active/default? '${profileType}')`);
  let url = `/demand-profiles/${oeEntityCode}/${profileType}?start=${targetDateStr}`;
  if (metricName && metricName.length > 0) {
    url += `&metric_name=${metricName}`;
  }
  return _demandProfileApi.oeHttpApi.axios.get(url, _demandProfileApi.oeHttpApi.headers)
    .then(httpRes => {
      const profile = httpRes.data;
      let timeInfo;
      if (profile.target_date && process.env.DEBUG) {
        // active profile
        timeInfo = `and target date ${profile.target_date}`;
      } else if (profile.week_day_id && process.env.DEBUG) {
        // default profile
        timeInfo = `and day of week ${profile.week_day_id}`;
      }
      oeSdkDemandDebug(`Returning a profile (type ${profileType.toUpperCase()}) with ID ${profile.profile_id} for entity code ${profile.entity_code} ${timeInfo} (created at ${profile.created_at})`);
      return profile;
    })
    .catch((error) => {
      _demandProfileApi._logErrorMsg(error, `Demand Profile retrieval (${profileType})`);
      throw error;
    });
};

_demandProfileApi.getActiveProfile = (oeEntityCode, targetDateStr, metricName) => {
  return _getProfile(oeEntityCode, targetDateStr, 'active', metricName);
};

_demandProfileApi.getDefaultProfile = (oeEntityCode, targetDateStr, metricName) => {
  return _getProfile(oeEntityCode, targetDateStr, 'default', metricName);
};

_demandProfileApi.patchEntityManagerMode = (oeEntityCode, mode) => {
  if (!mode) {
    mode = 'cd-mode';
  }
  return _demandProfileApi.oeHttpApi.axios.patch(`/demand-profiles/${oeEntityCode}/mode`, { key: 'em-mode', value: mode }, _demandProfileApi.oeHttpApi.headers)
    .then(httpRes => {
      if (httpRes.status !== 204) {
        const msg = `Not the expected status code (${httpRes.status}) for the entity manager mode for entity code: ${oeEntityCode}`;
        oeSdkDemandDebug(`ERROR ${msg}`);
        throw Promise.reject(msg);
      }
      // TODO shall we return something different than 'undefined'?
      return Promise.resolve();
    });
};

_demandProfileApi.getEntityManagerMode = (oeEntityCode) => {
  return _demandProfileApi.oeHttpApi.axios.get(
    `/demand-profiles/${oeEntityCode}/mode`,
    _demandProfileApi.oeHttpApi.headers
  )
    .then(httpRes => {
      const emm = httpRes.data;
      return emm;
    });
};

const _patchProfile = (oeEntityCode, aProfile, profileType) => {
  return _demandProfileApi.patchEntityManagerMode(oeEntityCode)
    .then(() => {
      return _demandProfileApi.oeHttpApi.axios.patch(`/demand-profiles/${oeEntityCode}/${profileType}`, aProfile, _demandProfileApi.oeHttpApi.headers);
    })
    .then(httpRes => {
      if (httpRes.status !== 200) {
        oeSdkDemandDebug(`ERROR When patching a profile, not the expected status code (${httpRes.status}) for entity code: ${oeEntityCode}`);
      }
      const patchedProfile = httpRes.data;
      oeSdkDemandDebug(`The patched profile response is: ${patchedProfile}`);
      return patchedProfile;
    })
    .catch((error) => {
      _demandProfileApi._logErrorMsg(error, `Demand Profile patch (${profileType})`);
      throw error;
    });
};

_demandProfileApi.patchActiveProfile = (oeEntityCode, aProfile) => {
  return _patchProfile(oeEntityCode, aProfile, 'active');
};

_demandProfileApi.patchDefaultProfile = (oeEntityCode, aProfile) => {
  return _patchProfile(oeEntityCode, aProfile, 'default');
};

module.exports = _demandProfileApi;
