process.env.DEBUG = 'oe-sdk*';

const moment = require('moment');
const chai = require('chai');
const expect = chai.expect;

const oeSdk = require('../index');

describe('\n\x1b[44mDemand Profiles API\x1b[0m\n', () => {
  const username = process.env.OE_USERNAME;
  const password = process.env.OE_PASSWORD;
  const entityCode = 'l4662';
  const targetDate = moment('2019-12-01').clone().format('YYYY-MM-DD');
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

  it('should retrieve an active profile, then upsert it', () => {
    return oeProdApi.demandProfiles.getActiveProfile(entityCode, targetDate)
      .then(activeProfile => {
        // console.log(`This is the retrieved ACTIVE profile: ${JSON.stringify(activeProfile, null, 2)}`);

        // fields for default profiles
        expect(activeProfile.week_day_id).to.equal(undefined);
        expect(activeProfile.default_profile_id).to.equal(undefined);

        // fields for active profiles
        expect(activeProfile.entity_code).to.equal(entityCode);
        expect(activeProfile.target_date).to.equal(targetDate);
        expect(activeProfile.profile_id).to.be.a('number');
        expect(activeProfile.metrics).to.be.instanceof(Array);
        // console.log(JSON.stringify(activeProfile.metrics, null, 2));
        expect(activeProfile.metrics).to.have.length(1);
        expect(activeProfile.metrics[0].metric_name).to.equal('cd-power-target');
        expect(activeProfile.metrics[0].shape).to.be.instanceof(Array);
        expect(activeProfile.metrics[0].shape).to.have.length(48);
        activeProfile.metrics[0].shape.forEach((shapeItem) => {
          expect(shapeItem.halfhour_start).to.be.above(0);
          expect(shapeItem.halfhour_start).to.be.below(49);
          expect(shapeItem.value).to.be.closeTo(1000.0, 1300.0); // just to know this is a float number
        });
        const isValidISOTimestamp = moment(activeProfile.created_at, 'YYYY-MM-DDTHH:mm:ssZ', true).isValid();
        /* eslint-disable no-unused-expressions */
        expect(isValidISOTimestamp).to.be.true;
        return activeProfile;
      })
      .then(activeProfile => {
        return oeProdApi.demandProfiles.patchActiveProfile(entityCode, activeProfile);
      })
      .then(profileId => {
        // console.log(`The Profile ID ${profileId}`);
        expect(profileId).to.be.a('number');
        expect(profileId).to.be.above(0);
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Active Profile retrieval');
        throw err;
      });
  });

  it('should retrieve an default profile, then upsert it', () => {
    return oeProdApi.demandProfiles.getDefaultProfile(entityCode, targetDate)
      .then(defaultProfile => {
        // console.log(`This is the retrieved DEFAULT profile: ${JSON.stringify(defaultProfile, null, 2)}`);

        // fields for active profiles
        expect(defaultProfile.target_date).to.equal(null);

        // fields for active profiles
        expect(defaultProfile.default_profile_id).to.be.a('number');
        expect(defaultProfile.week_day_id).to.equal(moment(targetDate).isoWeekday()); // 7 (Sunday)
        expect(defaultProfile.profile_id).to.be.a('number');
        expect(defaultProfile.entity_code).to.equal(entityCode);
        expect(defaultProfile.metrics).to.be.instanceof(Array);
        // console.log(JSON.stringify(defaultProfile.metrics, null, 2));
        expect(defaultProfile.metrics).to.have.length(1);
        expect(defaultProfile.metrics[0].metric_name).to.equal('cd-power-target');
        expect(defaultProfile.metrics[0].shape).to.be.instanceof(Array);
        expect(defaultProfile.metrics[0].shape).to.have.length(48);
        defaultProfile.metrics[0].shape.forEach((shapeItem) => {
          expect(shapeItem.halfhour_start).to.be.above(0);
          expect(shapeItem.halfhour_start).to.be.below(49);
          expect(shapeItem.value).to.be.closeTo(1000.0, 1300.0); // just to know this is a float number
        });
        const isValidISOTimestamp = moment(defaultProfile.created_at, 'YYYY-MM-DDTHH:mm:ssZ', true).isValid();
        /* eslint-disable no-unused-expressions */
        expect(isValidISOTimestamp).to.be.true;
        return defaultProfile;
      })
      .then(defaultProfile => {
        return oeProdApi.demandProfiles.patchDefaultProfile(entityCode, defaultProfile);
      })
      .then(profileId => {
        console.log(`The Profile ID ${profileId}`);
        expect(profileId).to.be.a('number');
        expect(profileId).to.be.above(0);
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Default Profile retrieval');
        throw err;
      });
  });
});
