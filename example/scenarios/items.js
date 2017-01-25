module.exports = {
  endpoints: [
    {
      request: {
        method: 'GET',
        path: '/items',
        cookies: {
          itemsposted: '1',
        },
      },
      response: {
        data: [
          {
            name: 'item one',
            id: '1',
          },
          {
            name: 'item two',
            id: '2',
          },
          {
            name: 'item three',
            id: '3',
          },
        ],
        cookies: {
          itemsposted: '',
        },
      },
    },
    {
      request: {
        method: 'GET',
        path: '/items',
      },
      response: {
        data: [
          {
            name: 'item one',
            id: '1',
          },
          {
            name: 'item two',
            id: '2',
          },
        ],
      },
    },
    {
      request: {
        method: 'POST',
        path: '/items',
        body: {
          name: 'item three',
        },
      },
      response: {
        status: '201',
        cookies: {
          itemsposted: '1',
        },
      },
    },
  ],
};
