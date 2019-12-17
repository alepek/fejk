let i = 0;
const impure = () => {
  i += 1;
  return { i };
};

export default {
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
