process.env.DEBUG = 'oe-sdk*';

const moment = require('moment');
const chai = require('chai');
const expect = chai.expect;

const config = require('./config');
const oeSdk = require('../index');

describe('\n\x1b[44mHistorical API\x1b[0m\n', () => {
  const username = process.env.OE_USERNAME;
  const password = process.env.OE_PASSWORD;
  const entityCode = 'L2510';
  const powerVariable = 'active-power';
  let oeProdApi;

  before(() => {
    if (!process.env.OE_USERNAME) {
      console.error('OE_USERNAME is not set! Exit!');
      process.exit();
    }
    if (!process.env.OE_PASSWORD) {
      console.error('OE_PASSWORD is not set! Exit!');
      process.exit();
    }
    return oeSdk.api.newInstance(username, password)
      .then((oeProdInstance) => {
        oeProdApi = oeProdInstance;
      });
  });

  it('should retrieve some raw data', () => {
    const startRawReadings = moment('2021-12-01 10:00:00').clone().toISOString();
    const endRawReadings = moment('2021-12-01 10:01:00').clone().toISOString();

    return oeProdApi.historical.getRawReadings("l2510", powerVariable, startRawReadings, endRawReadings)
      .then(rawReadings => {
        // console.log(`These are the retrieved raw readings: \n${JSON.stringify(rawReadings, null, 2)}\n`);
        expect(rawReadings).to.be.instanceof(Array);
        // console.log(`Length of rawReadings Array: ${rawReadings.length}`);
        expect(rawReadings).to.be.lengthOf(32);
        rawReadings.forEach(readingElem => {
          expect(readingElem.time).to.match(config.isoDateTimeWithMillisecondsPattern);
          expect(readingElem.value).to.be.a('number');
          expect(readingElem.key.toUpperCase()).to.equal(entityCode);
        });
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Raw readings');
        throw err;
      });
  });

  it('should retrieve some resampled data', () => {
    const startRawReadings = moment('2021-12-01 15:00:00').clone().toISOString();
    const endRawReadings = moment('2021-12-01 16:01:00').clone().toISOString();

    return oeProdApi.historical.getResampledReadings(entityCode, powerVariable, startRawReadings, endRawReadings)
      .then(resampledReadings => {
        // console.log(`These are the retrieved resampled readings: \n${JSON.stringify(resampledReadings, null, 2)}`);
        expect(resampledReadings).to.be.instanceof(Array);
        expect(resampledReadings).to.have.lengthOf(3);
        resampledReadings.forEach(readingElem => {
          expect(readingElem.time).to.match(config.isoDateTimeNoMillisecondsPattern);
          expect(readingElem.value).to.be.a('number');
          expect(readingElem.key.toUpperCase()).to.equal(entityCode);
        });
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Raw readings');
        throw err;
      });
  });
});
