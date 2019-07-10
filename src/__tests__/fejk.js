/* eslint comma-dangle: 0 */

const path = require('path');
const express = require('express');
const supertest = require('supertest');
const dataDefault = require('./__data__/default');
const dataScenario = require('./__data__/scenario');

const fejk = require('../fejk');

const DATA = path.join(__dirname, '__data__');

describe('fejk', () => {
  const logger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
  let app;

  beforeEach(() => {
    app = express();
    app.use(fejk({ logger, path: DATA }));
  });

  it('responds with mock from default scenario', () => supertest(app)
    .get('/colors')
    .expect(200)
    .expect(dataDefault.endpoints[0].response.data)
    .expect('X-Foo', 'bar'));

  it('responds with 404 if request is not found in scenario', () => supertest(app)
    .get('/users')
    .expect(404));

  it('responds with mock from another scenario', () => supertest(app)
    .get('/users?scenario=scenario&foo=bar')
    .set('Cookie', 'track=this')
    .expect(200)
    .expect(dataScenario.endpoints[0].response.data));

  it('switches default scenario via API', () => supertest(app)
    .get('/colors')
    .expect(200)
    .expect(dataDefault.endpoints[0].response.data)
    .then(() => supertest(app)
      .post('/__scenario')
      .send({ scenario: 'impure' })
      .expect(201))
    .then(() => supertest(app)
      .get('/foo')
      .expect(200)
      .expect({ i: 1 })));

  it('uses FEJK_PATH env var', () => {
    process.env.FEJK_PATH = path.join(__dirname, '__data__');

    app = express();
    app.use(fejk({ logger }));

    return supertest(app)
      .get('/colors')
      .expect(200)
      .expect(dataDefault.endpoints[0].response.data);
  });

  describe('cors', () => {
    beforeEach(() => {
      app = express();
    });

    it('wildcard origin', () => {
      app.use(fejk({ logger, path: DATA }));

      return supertest(app)
        .options('/colors')
        .expect(204)
        .expect('Access-Control-Allow-Origin', '*')
        .expect(res => {
          if (res.headers['access-control-allow-credentials']) {
            throw new Error('Unexpected header: access-control-allow-credentials');
          }
        });
    });

    it('custom origin', () => {
      app.use(fejk({
        cors: {
          origin: 'https://foo.com'
        },
        logger,
        path: DATA
      }));

      return supertest(app)
        .options('/colors')
        .expect(204)
        .expect('Access-Control-Allow-Origin', 'https://foo.com');
    });

    it('credentials', () => {
      app.use(fejk({
        cors: {
          credentials: true,
        },
        logger,
        path: DATA
      }));

      return supertest(app)
        .options('/colors')
        .expect(204)
        .expect('Access-Control-Allow-Origin', '*')
        .expect('Access-Control-Allow-Credentials', 'true');
    });
  });
});
