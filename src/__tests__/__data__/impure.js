let i = 0;
const impure = () => {
  i += 1;
  return i;
};

module.exports = {
  endpoints: [
    {
      request: {
        method: 'GET',
        path: '/*',
      },
      response: {
        data: impure,
      },
    },
  ],
};
