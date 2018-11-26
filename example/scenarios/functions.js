module.exports = {
  endpoints: [
    {
      request(req) {
        return req.path === '/foo' && req.query.foo === 'bar';
      },
      response: {
        status: 200,
        data: () => 'matched by function, generated by function',
      },
    },
    // The function-based approach above can also be represented by the endpoint below.
    {
      request: {
        path: '/foo',
        query: { foo: 'bar' },
      },
      response: {
        status: 200,
        data: () => 'matched by object, generated by function',
      },
    },
  ],
};
