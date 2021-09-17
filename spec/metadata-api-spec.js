process.env.DEBUG = 'oe-sdk*';

const chai = require('chai');
const expect = chai.expect;

const config = require('./config');
const oeSdk = require('../index');

describe('\n\x1b[44mMetadata API\x1b[0m\n', () => {
  const username = process.env.OE_USERNAME;
  const password = process.env.OE_PASSWORD;
  const entityCode = 'l4662';
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

  it('should retrieve the entity details with all the tags', () => {
    return oeProdApi.metadata.getEntityDetails(entityCode)
      .then(entityDetails => {
        // console.log(`These are the entity details: \n${JSON.stringify(entityDetails, null, 2)}`);

        expect(entityDetails.code).to.equal(entityCode);
        expect(entityDetails.type).to.equal('L'); // load
        expect(entityDetails.name).to.equal('SDK dummy load');
        expect(entityDetails.asset_parent).to.equal('d993');
        expect(entityDetails.updated_at).to.equal('2019-12-06T10:56:04.0869095Z');
        expect(entityDetails.updated_by).to.equal('bot@openenergi.com');
        expect(entityDetails.tags).to.be.instanceof(Array);
        expect(entityDetails.tags).to.have.lengthOf(1);

        // energy manager mode
        expect(entityDetails.tags[0].key).to.equal('em-mode');
        expect(entityDetails.tags[0].value).to.equal('cd-mode');
        expect(entityDetails.tags[0].updated_at).to.match(config.isoDateTimeWithMillisecondsPattern);
        expect(entityDetails.tags[0].updated_by).to.equal('api-tests@openenergi.com');

        /* eslint-disable no-unused-expressions */
        expect(entityDetails.tags[0].inherited).to.be.false;
        expect(entityDetails.service_parent).to.be.null;
        expect(entityDetails.has_asset_children).to.be.false;
        expect(entityDetails.has_service_children).to.be.false;
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Metadata API');
        throw err;
      });
  });

  it('should explain the hierarchy for a given entity', () => {
    return oeProdApi.metadata.explainHierarchy(entityCode)
      .then(explainedHierarchy => {
        // console.log(`This is the explained hierarchy: \n${JSON.stringify(explainedHierarchy, null, 2)}`);

        expect(explainedHierarchy.EntityName).to.equal('SDK dummy load');
        expect(explainedHierarchy.ParentEntityCode).to.equal('d993');
        expect(explainedHierarchy.ParentName).to.equal('SDK dummy device');
        expect(explainedHierarchy.GrandParentEntityCode).to.equal('s535');
        expect(explainedHierarchy.GrandParentName).to.equal('SDK dummy site');
      })
      .catch((err) => {
        oeSdk.helpers._logErrorMsg(err, 'Metadata API');
        throw err;
      });
  });
});
