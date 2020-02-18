process.env.DEBUG = 'oe-sdk*';

const moment = require('moment');
const chai = require('chai');
const expect = chai.expect;

const config = require('./config');
const oeSdk = require('../index');

describe('\n\x1b[44mHistorical API\x1b[0m\n', () => {
  const username = process.env.OE_USERNAME;
  const password = process.env.OE_PASSWORD;
  const entityCode = 'l4662';
  const powerVariable = 'active-power';
  let oeProdApi;

  before(() => {
    return oeSdk.api.newInstance(username, password)
      .then((oeProdInstance) => {
        oeProdApi = oeProdInstance;
      });
  });

  it('should retrieve some raw data', () => {
    const startRawReadings = moment('2019-12-01 10:00:00').clone().toISOString();
    const endRawReadings = moment('2019-12-01 12:00:00').clone().toISOString();

    return oeProdApi.historical.getRawReadings(entityCode, powerVariable, startRawReadings, endRawReadings)
      .then(rawReadings => {
        // console.log(`These are the retrieved raw readings: \n${JSON.stringify(rawReadings, null, 2)}`);

        expect(rawReadings).to.be.instanceof(Array);
        expect(rawReadings).to.have.lengthOf(3);
        rawReadings.map(readingElem => {
          expect(readingElem.time).to.match(config.isoDateTimeWithMillisecondsPattern);
          expect(readingElem.value).to.be.a('number');
          expect(readingElem.value).to.be.above(0);
          expect(readingElem.value).to.be.below(11);
          expect(readingElem.key).to.equal(entityCode);
        });
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Raw readings');
        throw err;
      });
  });

  it('should retrieve some resampled data', () => {
    const startRawReadings = moment('2019-12-01 15:00:00').clone().toISOString();
    const endRawReadings = moment('2019-12-01 16:01:00').clone().toISOString();

    return oeProdApi.historical.getResampledReadings(entityCode, powerVariable, startRawReadings, endRawReadings)
      .then(resampledReadings => {
        // console.log(`These are the retrieved resampled readings: \n${JSON.stringify(resampledReadings, null, 2)}`);

        expect(resampledReadings).to.be.instanceof(Array);
        expect(resampledReadings).to.have.lengthOf(3);
        resampledReadings.map(readingElem => {
          expect(readingElem.time).to.match(config.isoDateTimeNoMillisecondsPattern);
          expect(readingElem.value).to.be.a('number');
          expect(readingElem.value).to.be.above(9);
          expect(readingElem.value).to.be.below(101);
          expect(readingElem.key).to.equal(entityCode);
        });
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Raw readings');
        throw err;
      });
  });
});
