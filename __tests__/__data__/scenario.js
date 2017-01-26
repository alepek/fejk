module.exports = {
  endpoints: [
    {
      request: {
        method: 'GET',
        path: '/users',
        query: {
          foo: 'bar',
        },
        cookies: {
          track: 'this',
        },
      },
      response: {
        data: [
          {
            name: 'Kerstin',
            id: '4859233',
          },
          {
            name: 'Bosse',
            id: '9283748932',
          },
        ],
        cookies: {
          itemsposted: '',
        },
      },
    },
  ],
};
