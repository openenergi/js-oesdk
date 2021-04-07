process.env.DEBUG = 'oe-sdk*';

const moment = require('moment');
const chai = require('chai');
const expect = chai.expect;

const oeSdk = require('../index');

describe('\n\x1b[44mHelpers\x1b[0m\n', () => {
  it('should generate a timestamp for a given Halfhour Start', () => {
    const dateStr = moment('2019-12-01').clone().format('YYYY-MM-DD');

    const hhs1Timestamp = oeSdk.helpers.hhsToTsISOString(1, dateStr);
    expect(hhs1Timestamp).to.equal('2019-12-01T00:00:00.000Z');
    const hhs48Timestamp = oeSdk.helpers.hhsToTsISOString(48, dateStr);
    expect(hhs48Timestamp).to.equal('2019-12-01T23:30:00.000Z');
  });

  it('should generate a valid date in the near future for a weekDayId', () => {
    const todayStr = moment().clone().format('YYYY-MM-DD');
    const weekDayId = 1;

    const dateStr = oeSdk.helpers.getDateFromWeekDayId(weekDayId);

    const testDate = moment(dateStr).clone();
    const today = moment(todayStr).clone();
    const todayPlus8 = today.clone().add(8, 'days');
    // console.log(`testDate: ${testDate.toISOString()}, today: ${today.toISOString()}, todayPlus8: ${todayPlus8.toISOString()}`);

    /* eslint-disable no-unused-expressions */
    const dateIsInNearFuture = testDate.isBefore(todayPlus8);
    expect(dateIsInNearFuture, `This ${testDate.toISOString()} is not after this ${todayPlus8.toISOString()}`).to.be.true;
  });

  it('should map a profile into a signal', () => {
    // given
    const profileMetric = 'target-energy';
    const todayStr = moment().clone().format('YYYY-MM-DD');
    const sampleListOfMetricsAndShapes = [{
      inMetricLable: profileMetric,
      inShape: [[16, 35], [38, 35]]
    }];
    const sampleProfile = oeSdk.helpers.getActiveProfile(sampleListOfMetricsAndShapes, todayStr);
    // console.log(`sampleProfile: \n${JSON.stringify(sampleProfile, null, 2)}`);

    // when
    const signalContent = oeSdk.helpers.mapProfileToSignalMessage(sampleProfile);
    // console.log(`signalContent: \n${JSON.stringify(signalContent, null, 2)}`);

    // then
    expect(signalContent.type).to.equal('variable-adjust');
    expect(signalContent.target.entity).to.equal(sampleProfile.entity_code);
    signalContent.content.forEach(contentElem => {
      expect(contentElem.values[0].name).to.equal(profileMetric);
      /* eslint-disable no-unused-expressions */
      expect(moment(contentElem.start_at, 'YYYY-MM-DDTHH:mm:ss.SSSZ').isValid()).is.true;
    });
  });
});
