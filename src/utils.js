const decache = require('decache');
const isSubset = require('is-subset');
const log = require('fancy-log');

/**
 * Finds the matching endpoint among the provided endpoints, returns false if there are no matches
 * @param  {Object} req       An Express.js request object
 * @param  {Array} endpoints  An array of fejk endpoints
 * @return {Object}           A single fejk endpoint, or undefined if no matches can be found
 */
const findMatchingEndpoint = (req, endpoints) => {
  const matches = endpoints.filter(endpoint => {
    const { request } = endpoint;

    if (typeof request === 'function') {
      return request(req);
    }

    const valid = request && Object.keys(request).length;
    if (!valid) {
      return false;
    }

    let match = true;

    Object.keys(request).forEach(key => {
      if (typeof (request[key]) === 'object') {
        const set = Object.assign({}, request[key]);
        const subset = Object.assign({}, req[key]);
        match = match && isSubset(subset, set);
      } else if (key === 'path') {
        const regexp = RegExp(request[key]);
        match = match && regexp.test(req[key]);
      } else {
        match = match && req[key] === request[key];
      }
    });

    return match;
  });

  return matches.length ? matches[0] : undefined;
};

/**
 * Fetches the response object for the fejk object matching the incoming request, or undefined
 * if there is no response matching the incoming request.
 * @param  {Object} req     An Express request object
 * @param  {Object} options An options object
 * @return {Object}         A fejk response object
 */
const loadScenario = (req, options) => {
  let response;

  try {
    const scenarioModule = req.query.scenario || 'default';
    const fullScenarioPath = `${options.path}/${scenarioModule}`;

    // See https://github.com/dwyl/decache/pull/37
    if (typeof jest !== 'undefined') {
      jest.resetModules(); // eslint-disable-line
    } else {
      // clear module from require cache
      decache(fullScenarioPath);
    }

    const scenario = require(fullScenarioPath); // eslint-disable-line
    const endpoints = scenario.endpoints;

    response = findMatchingEndpoint(req, endpoints);
  } catch (err) {
    log.error('Scenario server error:', err);
  }

  return response;
};

/**
 * Parse response data from endpoint
 * @param  {Object} req       An Express.js request object
 * @param  {Object} endpoint  A fejk response object
 * @return {Object}           Response data for the matching request
 */
const responseData = (req, endpoint) => {
  if (typeof (endpoint.response.data) === 'function') {
    return endpoint.response.data(req);
  }
  return endpoint.response.data || 'OK';
};

module.exports = {
  findMatchingEndpoint,
  loadScenario,
  responseData,
};
