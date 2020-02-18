const oeSdkDebug = require('debug')('oe-sdk');
const oeSdkHttpDebug = require('debug')('oe-sdk-http');
const axios = require('axios');

const oeHelpers = require('./oe-helpers');
const oeConf = require('./oe-conf');

const oeApiFactory = {};

oeApiFactory.newInstance = (username, password, baseURL, timeout) => {
  const oeApiInstance = _create(baseURL, timeout);
  return Promise.resolve()
    .then(() => {
      return oeHelpers.getJwt(username, password, oeApiInstance);
    })
    .then((jwt) => {
      _configureJwt(jwt, oeApiInstance);
      _configureApis(oeConf.apiExtensions, oeApiInstance);
      oeSdkDebug('Done initialising the OE API via username/password');
      return oeApiInstance;
    })
    .catch((err) => {
      oeHelpers._logErrorMsg(err, 'Init the OE API');
      throw err;
    });
};

oeApiFactory.newInstanceSkipAuth = (jwt, baseURL, timeout) => {
  const oeApiInstance = _create(baseURL, timeout);
  return Promise.resolve(jwt)
    .then((jwt) => {
      _configureJwt(jwt, oeApiInstance);
      _configureApis(oeConf.apiExtensions, oeApiInstance);
      oeSdkDebug(`Done initialising the OE API via JWT (${jwt})`);
      return oeApiInstance;
    })
    .catch((err) => {
      oeHelpers._logErrorMsg(err, 'Init the OE API (skip auth)');
      throw err;
    });
};

oeApiFactory.plugApi = (keyString, apiObject, oeApi) => {
  oeApi[keyString] = apiObject;
  apiObject.init(oeApi._http, oeHelpers._logErrorMsg);
  oeSdkDebug(`Done plugging the API extension '${keyString}'`);
};

const _configureApis = (apiExtensions, oeApi) => {
  const results = apiExtensions.map((elem) => {
    // extend the API object with the current API endpoint
    elem.fieldValue.init(oeApi._http, oeHelpers._logErrorMsg);
    oeApi[elem.fieldKey] = elem.fieldValue;
    return `Done with API extension '${elem.fieldKey}'`;
  });
  oeSdkDebug(`Done with the API endpoints: \n${JSON.stringify(results, null, 2)}`);
};

const _configureJwt = (inJwt, oeApi) => {
  const jwt = inJwt.replace('Bearer ', ''); // in case that prefix is there, we remove it!
  oeApi._http.jwt = jwt;
  oeApi._http.headers = {
    headers: {
      Authorization: `Bearer ${oeApi._http.jwt}`,
      'Content-Type': 'application/json'
    }
  };
  oeSdkDebug(`Done configuring this JWT (length ${jwt.length}) ending with '${jwt.substring(jwt.length - 10, jwt.length)}'`);
};

const _create = (baseURL, timeout) => {
  const oeApiInstance = {};
  oeApiInstance._http = {};
  if (!baseURL) {
    baseURL = 'https://api.openenergi.net/v1';
  }
  if (!timeout) {
    timeout = 30000; // 30 seconds
  }
  oeApiInstance._http.axios = axios.create({
    baseURL: baseURL,
    timeout: timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  oeApiInstance._http.axios.interceptors.request.use(req => {
    oeSdkHttpDebug(`request  for method '${req.method}' and path '${req.url}' (base URL '${baseURL}')`);
    return req;
  });
  oeApiInstance._http.axios.interceptors.response.use(res => {
    oeSdkHttpDebug(`response for method '${res.config.method}' and path '${res.config.url}' (base URL '${baseURL}'): ${res.statusText} (${res.status})`);
    return res;
  });
  oeSdkDebug(`Done creating the OE API object with base URL ${baseURL}`);
  return oeApiInstance;
};

module.exports = oeApiFactory;
