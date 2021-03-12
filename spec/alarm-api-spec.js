process.env.DEBUG = 'oe-sdk*';

const chai = require('chai');
const expect = chai.expect;

// const config = require('./config');
const oeSdk = require('../index');

describe('\n\x1b[44mAlarm API\x1b[0m\n', () => {
  const username = process.env.OE_USERNAME;
  const password = process.env.OE_PASSWORD;
  const entityCode = 'L1';
  let oeProdApi;

  before(() => {
    return oeSdk.api.newInstance(username, password)
      .then((oeProdInstance) => {
        oeProdApi = oeProdInstance;
      });
  });

  it('should retrieve the alarms', () => {
    return oeProdApi.alarm.getAlarmsByScope(entityCode)
      .then(alarmDetails => {
        // console.log(`These are the alarm details: \n${JSON.stringify(alarmDetails, null, 2)}`);
        expect(alarmDetails.items).to.have.lengthOf(2);
        expect(alarmDetails.items[0]).created_by.to.equal('test-user@openenergi.com');
        expect(alarmDetails.items[1]).created_by.to.equal('another-user@openenergi.com');
        expect(alarmDetails.items[0]).condition.variable.to.equal('test-soc');
        expect(alarmDetails.items[1]).condition.operator.to.equal('geq');
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Alarm API');
        throw err;
      });
  });
});
