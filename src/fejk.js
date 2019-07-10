const corsMiddleware = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');

const { loadScenario, responseData } = require('./utils');

function fejkHandler(options, req, res) {
  const { logger } = options;
  const scenario = loadScenario(req, options);

  res.set('Cache-Control', 'no-cache');

  // For now, just respond with a 200 to potential pre-flight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  if (scenario) {
    logger.info(`Scenario found for ${req.method} ${req.url}`);

    const cookies = scenario.response.cookies || {};
    Object.keys(cookies).forEach(key => res.cookie(key, cookies[key]));

    return res.status(scenario.response.status || 200).send(responseData(req, scenario));
  }

  logger.warn(`No scenario found for ${req.method} ${
    req.protocol}://${req.headers.host}${req.url} headers:${
    JSON.stringify(req.headers)} cookies:${JSON.stringify(req.cookies)}`);

  res.status(404).send('No endpoint match found!');
}

function setupHandler(router, options) {
  router.all('*', fejkHandler.bind(null, options));
}

module.exports = ({
  cors,
  logger = console,
  path = process.env.FEJK_PATH,
  scenario = 'default',
} = {}) => {
  const router = express.Router();

  router.use(bodyParser.json());
  router.use(cookieParser());
  router.use(corsMiddleware(cors));

  router.post('/__scenario', (req, res) => {
    if (!req.body.scenario) {
      return res.sendStatus(400);
    }

    // Remove the old handler
    router.stack.pop();

    // Add the new handler with the updated scenario
    setupHandler(router, {
      logger,
      path,
      scenario: req.body.scenario,
    });

    res.sendStatus(201);
  });

  setupHandler(router, {
    logger,
    path,
    scenario,
  });

  return router;
};
