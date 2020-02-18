process.env.DEBUG = 'oe-sdk*';

const chai = require('chai');
const expect = chai.expect;

const moment = require('moment');

const config = require('./config');
const oeSdk = require('../index');

describe('\n\x1b[44mSignal API\x1b[0m\n', () => {
  const username = process.env.OE_USERNAME;
  const password = process.env.OE_PASSWORD;

  let oeProdApi;

  let sampleProfile;

  before(() => {
    return oeSdk.api.newInstance(username, password)
      .then((oeProdInstance) => {
        oeProdApi = oeProdInstance;

        // generate a valid sample profile
        const profileMetric = 'target-energy';
        const todayStr = moment().clone().format('YYYY-MM-DD');
        const sampleListOfMetricsAndShapes = [{
          inMetricLable: profileMetric,
          inShape: [[16, 35], [38, 35]]
        }];
        sampleProfile = oeSdk.helpers.getActiveProfile(sampleListOfMetricsAndShapes, todayStr);
      });
  });

  it('should dispatch a signal', () => {
    const signalContent = oeSdk.helpers.mapProfileToSignalMessage(sampleProfile);
    return oeProdApi.signal.dispatchSignal(signalContent)
      .then(correlationId => {
        // console.log(`The Signal context: ${correlationId}`);
        expect(correlationId).to.match(config.uuidRegex);
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Signal dispatch');
        throw err;
      });
  });

  it('should dispatch a profile', () => {
    return oeProdApi.signal.dispatchProfile(sampleProfile)
      .then(correlationId => {
        console.log(`The Signal context: ${correlationId}`);
        expect(correlationId).to.match(config.uuidRegex);
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Profile dispatch');
        throw err;
      });
  });
});
