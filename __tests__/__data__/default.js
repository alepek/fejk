module.exports = {
  endpoints: [
    {
      request: {
        method: 'GET',
        path: '/colors',
      },
      response: {
        data: [
          {
            name: 'red',
            id: '12345',
          },
          {
            name: 'blue',
            id: '67890',
          },
        ]
      },
    },
  ],
};
