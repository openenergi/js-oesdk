const oeSdkMetadataDebug = require('debug')('oe-sdk-metadata');

const _metadataApi = {};
_metadataApi.init = (oeHttpApi, _logErrorMsgFunc) => {
  _metadataApi.oeHttpApi = oeHttpApi;
  _metadataApi._logErrorMsg = _logErrorMsgFunc;
};

_metadataApi.getEntityDetails = (entityCode) => {
  oeSdkMetadataDebug(`Retrieving entity details for entity code: ${entityCode}`);
  const axiosConfig = {};
  axiosConfig.params = {
    expand_tags: true
  };
  axiosConfig.headers = _metadataApi.oeHttpApi.headers.headers;
  return _metadataApi.oeHttpApi.axios.get(`/entities/${entityCode}`, axiosConfig)
    .then(httpResponse => {
      const entityDetails = httpResponse.data;
      oeSdkMetadataDebug(`Returning entity details (with expanded tags) for entity '${entityCode}'`);
      return entityDetails;
    })
    .catch((err) => {
      _metadataApi._logErrorMsg(err, 'Retrieving entity details (with expanded tags) from the OE API');
      throw err;
    });
};

_metadataApi.explainHierarchy = (entityCode) => {
  let entity;
  let parentEntity;
  let grandParentEntity;

  return _metadataApi.getEntityDetails(entityCode)
    .then(entityFromApi => {
      entity = entityFromApi;
      if (entity.asset_parent) {
        return _metadataApi.getEntityDetails(entity.asset_parent);
      } else {
        return {};
      }
    })
    .then(parentEntityFromApi => {
      parentEntity = parentEntityFromApi;
      if (parentEntity.asset_parent) {
        return _metadataApi.getEntityDetails(parentEntity.asset_parent);
      } else {
        return {};
      }
    })
    .then(grandParentEntityFromApi => {
      grandParentEntity = grandParentEntityFromApi;
      // TODO IP Address
    })
    .then(() => {
      const infoDetails = {};
      infoDetails.EntityName = entity.name;
      // TODO infoDetails.IpAddress;
      infoDetails.ParentEntityCode = entity.asset_parent;
      infoDetails.ParentName = parentEntity.name;
      infoDetails.GrandParentEntityCode = parentEntity.asset_parent;
      infoDetails.GrandParentName = grandParentEntity.name;
      return infoDetails;
    })
    .catch((err) => {
      _metadataApi._logErrorMsg(err, 'Explaining the hierarchy for a given entity code from the OE API');
      throw err;
    });
};

module.exports = _metadataApi;
