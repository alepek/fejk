export default {
  endpoints: [
    // This endpoint is listed before the auth checker endpoint,
    // and will therefore not require authentication.
    {
      request: {
        path: '/authenticate',
        method: 'POST',
        // You would probably add restrictions on the payload here, this example skips that.
      },
      response: {
        status: 200,
        cookies: {
          token: 'auth-token',
        },
      },
    },
    // The auth checker will be 'pass through' if there is an auth cookie with the right content.
    // The negated condition can not be expressed by using the simpler request subset matching.
    {
      request(req) {
        // This could be any other property of the request, such as a header, instead.
        return req.cookies.token !== 'auth-token';
      },
      response: {
        status: 401,
        data: 'Authorization required',
      },
    },
    // If none of the previous endpoints matched,
    // the user is authenticated and is not trying to authenticate.
    {
      request: {
        path: '/secured-resource',
        method: 'GET',
      },
      response: {
        status: 200,
        data: 'Stuff only authorized users can see',
      },
    },
  ],
};
