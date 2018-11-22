const path = require('path');
const express = require('express');
const supertest = require('supertest');
const dataDefault = require('./__data__/default');
const dataScenario = require('./__data__/scenario');

const fejk = require('../fejk');

describe('fejk', () => {
  const logger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
  let app;

  beforeEach(() => {
    app = express();
    app.use(fejk({ logger, path: path.join(__dirname, '__data__') }));
  });

  it('responds with mock from default scenario', () =>
    supertest(app)
      .get('/colors')
      .expect(200)
      .expect(dataDefault.endpoints[0].response.data));

  it('responds with 404 if request is not found in scenario', () =>
    supertest(app)
      .get('/users')
      .expect(404));

  it('responds with mock from another scenario', () =>
    supertest(app)
      .get('/users?scenario=scenario&foo=bar')
      .set('Cookie', 'track=this')
      .expect(200)
      .expect(dataScenario.endpoints[0].response.data));

  it('uses FEJK_PATH env var', () => {
    process.env.FEJK_PATH = path.join(__dirname, '__data__');

    app = express();
    app.use(fejk({ logger }));

    return supertest(app)
      .get('/colors')
      .expect(200)
      .expect(dataDefault.endpoints[0].response.data);
  });
});
