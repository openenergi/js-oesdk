const oeSdkHelpersDebug = require('debug')('oe-sdk-helpers');

const moment = require('moment');

const oeHelpers = {};

oeHelpers._logErrorMsg = (err, idMessage) => {
  if (!idMessage) {
    idMessage = 'OE-ERROR';
  }

  if (err && err.response && err.response.status && err.response.data) {
    // HTTP axios stuff
    oeSdkHelpersDebug(`OE-ERROR: ${idMessage}, HTTP status code: ${err.response.status} HTTP response body: \n${JSON.stringify(err.response.data, null, 2)}`);
  } else {
    // console.log(`${idMessage}, error: ${JSON.stringify(err)}`);
    oeSdkHelpersDebug(`OE-ERROR: ${idMessage}, error: ${err}`);
  }
};

oeHelpers.getJwt = (username, password, oeApi) => {
  const credentials = {
    username: username,
    password: password
  };
  return oeApi._http.axios
    .post('/auth', credentials)
    .then(httpResponse => {
      const jwt = httpResponse.data.token;
      return jwt;
    })
    .catch((err) => {
      oeSdkHelpersDebug(err);
      throw err;
    });
};

oeHelpers.formatMetricWithShape = (metricAndShape) => {
  if (!metricAndShape) {
    oeSdkHelpersDebug('Making up a valid metric with shape...');
    metricAndShape = {
      inMetricLable: 'target-energy',
      inShape: [[16, 35], [38, 35]]
    };
  }
  const shapeArray = metricAndShape.inShape.map(elem => { return { halfhour_start: elem[0], value: elem[1] }; });

  const validMetricAndShape = {
    metric_name: metricAndShape.inMetricLable,
    shape: shapeArray
  };
  return validMetricAndShape;
};

// {
//   "target_date": "2020-02-06",
//   "metrics": [
//     {
//       "metric_name": "target-energy",
//       "shape": [
//         {
//           "halfhour_start": 16,
//           "value": 35
//         },
//         {
//           "halfhour_start": 38,
//           "value": 35
//         }
//       ]
//     },
//     {
//       "metric_name": "target-power",
//       "shape": [
//         {
//           "halfhour_start": 16,
//           "value": 35
//         },
//         {
//           "halfhour_start": 38,
//           "value": 35
//         }
//       ]
//     }
//   ]
// }
oeHelpers.getActiveProfile = (listOfMetricAndShape, targetDateStr, entityCode) => {
  if (!listOfMetricAndShape) {
    listOfMetricAndShape = [undefined];
  }
  oeSdkHelpersDebug(`Processing ${listOfMetricAndShape.length} metrics, ${JSON.stringify(listOfMetricAndShape, null, 2)}`);
  const listOfValidMetrics = listOfMetricAndShape.map(metricAndShape => { return oeHelpers.formatMetricWithShape(metricAndShape); });

  if (!targetDateStr) {
    targetDateStr = moment().clone().format('YYYY-MM-DD');
  }

  if (!entityCode) {
    entityCode = 'foo-entity-code';
  }

  return {
    target_date: targetDateStr,
    entity_code: entityCode,
    metrics: listOfValidMetrics
  };
};

oeHelpers.sleepPromise = (millis) => {
  oeSdkHelpersDebug(`Sleeping for ${millis} milliseconds`);
  return new Promise((resolve) => {
    setTimeout(() => resolve(), millis);
  });
};

// HHS ID  1: 2020-02-06T00:00:00.000Z
// HHS ID 48: 2020-02-06T23:30:00.000Z
oeHelpers.hhsToTsISOString = (hhs, todayDateStr) => {
  if (hhs > 48 || hhs < 1) {
    oeSdkHelpersDebug(`Invalid HalfHourStart: ${hhs}`);
    return undefined;
  }
  if (!todayDateStr) {
    todayDateStr = moment().clone().format('YYYY-MM-DD');
  }
  const currTsISOString = moment(todayDateStr).add((hhs * 30) - 30, 'minutes').toISOString();
  oeSdkHelpersDebug(`HHS ID ${String('  ' + hhs).slice(-2)}: ${currTsISOString}`);
  return currTsISOString;
};

// get next valid date for the input week day ID
oeHelpers.getDateFromWeekDayId = (weekDayId) => {
  const currTimestamp = moment(Date.now());
  const currWeekDayId = parseInt(currTimestamp.format('E'));
  if (currWeekDayId > weekDayId) {
    const validDay = currTimestamp.subtract((currWeekDayId - weekDayId), 'days');
    return validDay.format('YYYY-MM-DD');
  } else if (currWeekDayId < weekDayId) {
    const validDay = currTimestamp.subtract((7 + currWeekDayId - weekDayId), 'days');
    return validDay.format('YYYY-MM-DD');
  }
  return currTimestamp.format('YYYY-MM-DD');
};

// output:
// {
//   "type": "variable-adjust",
//   "target": {
//     "entity": "foo-entity-code"
//   },
//   "content": [
//     {
//       "start_at": "2020-02-17T07:30:00.000Z",
//       "values": [
//         {
//           "name": "target-energy",
//           "value": 35
//         }
//       ]
//     },
//     {
//       "start_at": "2020-02-17T18:30:00.000Z",
//       "values": [
//         {
//           "name": "target-energy",
//           "value": 35
//         }
//       ]
//     }
//   ]
// }
oeHelpers.mapProfileToSignalMessage = (profile, signalType, dateStr) => {
  const signalRequest = {};

  if (!signalType) {
    signalType = 'variable-adjust';
  }
  signalRequest.type = signalType;

  signalRequest.target = {};
  signalRequest.target.entity = profile.entity_code; // load code

  // initialise the map between halfhour_start and an array of variables with their value
  const shapeItemsMap = {};
  for (let hhsIdx = 1; hhsIdx < 49; hhsIdx++) {
    shapeItemsMap[hhsIdx] = [];
  }

  // build the signal content
  for (let metricIdx = 0; metricIdx < profile.metrics.length; metricIdx++) {
    const currentMetric = profile.metrics[metricIdx];
    for (let shapeIdx = 0; shapeIdx < currentMetric.shape.length; shapeIdx++) {
      const currentMetricShapeItem = currentMetric.shape[shapeIdx];

      const currValueItem = {};
      currValueItem.name = currentMetric.metric_name;
      currValueItem.value = currentMetricShapeItem.value;

      // append the element to the array
      shapeItemsMap[currentMetricShapeItem.halfhour_start].push(currValueItem);
      oeSdkHelpersDebug(`metricIdx ${metricIdx}, shapeIdx ${shapeIdx}, the map element: ${JSON.stringify(shapeItemsMap[currentMetricShapeItem.halfhour_start])}`);
    }
  }

  if (!dateStr) {
    dateStr = moment().clone().format('YYYY-MM-DD');
  }

  signalRequest.content = [];
  for (let hhsIdx = 1; hhsIdx < 49; hhsIdx++) {
    const currItems = shapeItemsMap[hhsIdx];
    if (currItems.length > 0) {
      const currElement = {};
      currElement.start_at = oeHelpers.hhsToTsISOString(hhsIdx, dateStr);
      currElement.values = currItems;
      signalRequest.content.push(currElement);
    }
  }

  return signalRequest;
};

module.exports = oeHelpers;
