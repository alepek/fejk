const path = require('path');
const rewire = require('rewire');
const smock = rewire('./src/smock');
const referenceScenario = require('./__data__/scenario');

const loadScenario = smock.__get__('loadScenario');
const findMatchingEndpoint = smock.__get__('findMatchingEndpoint');

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

  it('matches the first valid endpoints', () => {
    const endpoint = {
      request: {
        path: '/items',
      },
      response: {
        status: 200,
      },
    };
    const endpoints = [endpoint, Object.assign({}, endpoint, {response: {status: 404}})];
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

describe('loadScenario', () => {
  it('loads the reference scenario', () => {
    process.env.SMOCK_PATH = path.join(__dirname, '__data__');

    const scenario = loadScenario(
      {
        path: '/users',
        method: 'GET',
        query: {'scenario': 'scenario', 'foo': 'bar', 'cookiesShould': 'doSuperSetMatching'},
        cookies: {track: 'this'},
      }
    );
    expect(scenario).toEqual(referenceScenario.endpoints[0]);
  });
});
