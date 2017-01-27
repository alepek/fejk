const path = require('path');
const rewire = require('rewire');
const referenceScenario = require('./__data__/scenario');
const referenceDefaultScenario = require('./__data__/default');

const smock = rewire('./src/smock');

const loadScenario = smock.__get__('loadScenario'); // eslint-disable-line
const findMatchingEndpoint = smock.__get__('findMatchingEndpoint'); // eslint-disable-line
const responseData = smock.__get__('responseData'); // eslint-disable-line

describe('endpoint matching', () => {
  it('does not match invalid endpoints', () => {
    const result = findMatchingEndpoint({
      path: '/items/123',
    }, [{
      request: {},
      response: {},
    }]);

    expect(result).toBe(undefined);
  });

  it('matches valid endpoints', () => {
    const endpoint = {
      request: {
        path: '/items',
      },
      response: {
        status: 200,
      },
    };
    const result = findMatchingEndpoint({
      path: '/items/123',
    }, [endpoint]);

    expect(result).toBe(endpoint);
  });

  it('matches valid regex endpoint', () => {
    const endpoint = {
      request: {
        path: '/item/\\d',
      },
      response: {
        status: 200,
      },
    };
    const result = findMatchingEndpoint({
      path: '/item/123/foo',
    }, [endpoint]);

    expect(result).toBe(endpoint);
  });

  it('matches the first valid endpoints', () => {
    const endpoint = {
      request: {
        path: '/items',
      },
      response: {
        status: 200,
      },
    };
    const endpoints = [endpoint, Object.assign({}, endpoint, { response: { status: 404 } })];
    const result = findMatchingEndpoint({
      path: '/items/123',
    }, endpoints);

    expect(result).toBe(endpoint);
  });

  it('respects query', () => {
    const endpoints = [
      {
        request: {
          path: '/items',
          query: {
            id: 1,
          },
        },
        response: {
          status: 200,
        },
      },
      {
        request: {
          path: '/items',
          query: {
            id: 2,
          },
        },
        response: {
          status: 404,
        },
      },
    ];
    const result = findMatchingEndpoint({
      path: '/items',
      query: {
        id: 2,
      },
    }, endpoints);

    expect(result).toBe(endpoints[1]);
  });
});

describe('response data parsing', () => {
  it('extracts static data', () => {
    const data = { foo: 123 };
    const endpoint = {
      response: {
        data,
      },
    };

    const result = responseData({}, endpoint);
    expect(result).toBe(data);
  });

  it('accepts a function as data', () => {
    const req = { foo: 1 };
    const endpoint = {
      response: {
        data: r => r,
      },
    };

    const result = responseData(req, endpoint);
    expect(result).toBe(req);
  });
});

describe('loadScenario', () => {
  it('loads the reference scenario', () => {
    process.env.SMOCK_PATH = path.join(__dirname, '__data__');

    const scenario = loadScenario({
      path: '/users',
      method: 'GET',
      query: { scenario: 'scenario', foo: 'bar', cookiesShould: 'doSuperSetMatching' },
      cookies: { track: 'this' },
    });
    expect(scenario).toEqual(referenceScenario.endpoints[0]);
  });

  it('loads the default scenario', () => {
    process.env.SMOCK_PATH = path.join(__dirname, '__data__');

    const scenario = loadScenario({
      path: '/colors',
      method: 'GET',
      query: {},
    });
    expect(scenario).toEqual(referenceDefaultScenario.endpoints[0]);
  });
});
