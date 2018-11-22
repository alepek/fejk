const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');

const { loadScenario, responseData } = require('./utils');

function fejkHandler(options, req, res) {
  const { logger } = options;
  const scenario = loadScenario(req, options);

  // Allow CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS, DELETE');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Cache-Control', 'no-cache');

  // For now, just respond with a 200 to potential pre-flight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }

  if (scenario) {
    logger.info(`Scenario found for ${req.method} ${req.path}`);

    const cookies = scenario.response.cookies || {};
    Object.keys(cookies).forEach(key => res.cookie(key, cookies[key]));

    return res.status(scenario.response.status || 200).send(responseData(req, scenario));
  }

  logger.warn(`No matching scenario for ${req.method} ${req.path}`);

  res.status(404).send('No endpoint match found!');
}

module.exports = ({
  logger = console,
  path = process.env.FEJK_PATH,
  scenario = 'default',
} = {}) => {
  const router = express.Router();

  router.use(bodyParser.json());
  router.use(cookieParser());

  router.all('*', fejkHandler.bind(null, { logger, path, scenario }));

  return router;
};
