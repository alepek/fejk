module.exports = {
  endpoints: [
    {
      request: {
        method: 'GET',
        path: '/colors',
      },
      response: {
        data: ['red', 'green', 'blue'],
      },
    },
  ],
};
