const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const log = require('fancy-log');

const { loadScenario, responseData } = require('./utils');

const app = express.Router();

app.use(bodyParser.json());
app.use(cookieParser());

app.all('*', (req, res) => {
  let respond;
  const scenario = loadScenario(req);

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
    respond = () => {
      const cookies = scenario.response.cookies || {};
      Object.keys(cookies).forEach(key => res.cookie(key, cookies[key]));
      return res.status(scenario.response.status || 200).send(responseData(req, scenario));
    };

    log.info(`Scenario found for ${req.method} ${req.path}`);
  } else { // eslint-disable-line
    respond = () => res.status(404).send('No endpoint match found!');

    log.warn(`No matching scenario for ${req.method} ${req.path}`);
  }

  return respond();
});

module.exports = app;
