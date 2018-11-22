const path = require('path');
const supertest = require('supertest');
const dataDefault = require('./__data__/default');
const dataScenario = require('./__data__/scenario');

const fejk = require('../fejk');

describe('fejk', () => {
  beforeEach(() => {
    process.env.FEJK_PATH = path.join(__dirname, '__data__');
  });

  it('responds with mock from default scenario', () =>
    supertest(fejk)
      .get('/colors')
      .expect(200)
      .expect(dataDefault.endpoints[0].response.data));

  it('responds with 404 if request is not found in scenario', () =>
    supertest(fejk)
      .get('/users')
      .expect(404));

  it('responds with mock from another scenario', () =>
    supertest(fejk)
      .get('/users?scenario=scenario&foo=bar')
      .set('Cookie', 'track=this')
      .expect(200)
      .expect(dataScenario.endpoints[0].response.data));
});
