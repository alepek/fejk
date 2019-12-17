import corsMiddleware from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';

import { loadScenario, responseData } from './utils';

async function fejkHandler(options, req, res) {
  const { logger } = options;
  const scenario = await loadScenario(req, options);

  res.set('Cache-Control', 'no-cache');

  // For now, just respond with a 200 to potential pre-flight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  if (scenario) {
    logger.info(`Scenario found for ${req.method} ${req.url}`);

    const cookies = scenario.response.cookies || {};
    Object.keys(cookies).forEach(key => res.cookie(key, cookies[key]));

    const headers = scenario.response.headers || {};
    Object.keys(headers).forEach(key => res.set(key, headers[key]));

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

export default function fejk({
  cors,
  extension = '.mjs',
  logger = console,
  path = process.env.FEJK_PATH,
  scenario = 'default',
} = {}) {
  const router = express.Router();

  router.use(bodyParser.json());
  router.use(cookieParser());
  router.use(corsMiddleware(cors));

  router.post('/__scenario', (req, res) => {
    if (!req.body.scenario) {
      return res.sendStatus(400);
    }

    logger.info(`Changing scenario to ${req.body.scenario}`);

    // Remove the old handler
    router.stack.pop();

    // Add the new handler with the updated scenario
    setupHandler(router, {
      extension,
      logger,
      path,
      scenario: req.body.scenario,
    });

    res.sendStatus(201);
  });

  setupHandler(router, {
    extension,
    logger,
    path,
    scenario,
  });

  return router;
}
