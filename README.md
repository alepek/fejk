# Fejk

[![Build Status](https://travis-ci.org/alepek/fejk.svg?branch=master)](https://travis-ci.org/alepek/fejk)

Fejk is a simple stateless HTTP mocking service with a faux-stateful mocking mechanism based on cookies.

Fejk is intended to be consumed by a browser-like client, but should work fine for any HTTP client. Cookie capabilities are a prerequisite for faux statefulness.

**ToC**

* [Terminology](#terminology)
* [Getting started](#getting-started)
* [Configuration](#configuration)
* [Scenario files](#scenario-files)
* [Selecting scenario](#selecting-scenario)
* [Switching the default scenario](#switching-the-default-scenario)
* [Examples and recipes](#examples-and-recipes)
* [Running the examples](#running-the-examples)

# Terminology

* `fejk` - a running instance of `fejk`.
* `scenario` - a collection of `endpoints`, stored in a `.js` file.
* `endpoints` - an array of `endpoint` objects.
* `endpoint` - an object containing a `request` and `response` field.
* `request` - a subset of an Express.js request object.
* `response` - `status`, `data`, `headers` and `cookies` with which to respond to a `request`.

# Getting started

Prerequisites: Node.js `^12.5.0`.
Dependencies required in your project: `body-parser`, `compression`, `cookie-parser`, `express`.

```js
const path = require('path');
const express = require('express');
const fejk = require('fejk');

const port = process.env.PORT || 9090;
const app = express();

// Feel free to mount the fejk express app under any route
app.use('/fejk', fejk({ path: path.join(__dirname, 'scenarios') }));

app.listen(port);
```

# Configuration

Fejk accepts the following config options.

```js
fejk({
  cors: {}, // Default: {}
  logger: customLogger, // Default: console
  path: '/path/to/scenarios', // Default: process.env.FEJK_PATH
  scenario: 'my-scenario', // Default: `default`
});
```

* `cors` - options for the [CORS Middleware](https://github.com/expressjs/cors), see configuration options for more info.
* `logger` - a custom logger.
* `path` - the path to the scenarios folder.
* `scenario` - which scenario to use as default.

# Scenario files

A scenario file is a `.js` file that should contain an object with an `endpoints` array. The file contents may be generated in any manner you wish, but be aware that it is included by `require` during execution.

Each `endpoint` must contain a `request` and `response` field. The `request` field is used to match against incoming requests to determine whether to use the `response` field to generate a response or not. If there are several matches the first match in the array of `endpoints` will be used.

## `request` [object | function]

### object

As an object, `request` needs to contain at least one key, but can contain any key that is present in an Express request.

Any key present in the `request` object must be present in the incoming Express request object and match exactly, with these exceptions:
 * `path` - The path in the `request` can be expressed as a regex.
 * objects - Objects in the `request` object only needs to be a **subset** of the corresponding field in the incoming Express request. This is useful for fields such as `cookies`.

### function

As a function, the `request` field is passed the incoming express `req` as a first parameter, and is expected to return a boolean indicating whether the `endpoint` matches or not.

## `response` [object]

The response object can contain the following properties:

### `status` [number]
The status code to respond with. Optional, defaults to `200`.

### `data` [any | function]
Optional, defaults to `'OK'`.

#### any

When `data` is anything other than a function, that field will be sent as the `body` of the response.

#### function

When `data` is a function, that function will be executed with the incoming Express request as its only parameter. The return value of the function will be sent as the `body` of the response.

**Heads up!** `fejk` does not use the require cache to store scenario files, meaning that **the data function must be [Pure](https://en.wikipedia.org/wiki/Pure_function)**. If you provide an impure function it will always respond with the initial state.

### `cookies` [object]
Optional. Any cookies to set in the response. If omitted no cookies will be set.

### `headers` [object]
Optional. Any headers to set in the response.

# Selecting scenario

Fejk has one reserved optional query string parameter - `scenario`. This parameter specifies which scenario file to load. E.g. if you want to use the scenario from the file `/scenarios/entries.js` and you've configured the scenario path as `/scenarios`, the `scenario` parameter should be `entries`.

If the `scenario` parameter is not specified, fejk will attempt to load a `default` scenario. The `default` scenario must be stored in the root of the configured scenario path and be named `default.js`, or according to the configured option. See [Configuration](#configuration).

Example requests:
```
http://localhost:9090/fejk/items?scenario=items
```
In this request, the `scenario` parameter will determine which file to load, and the path (and potentially cookies) will determine which `endpoint` to load in that file.
```
http://localhost:9090/fejk/colors
```
In this request, the `default` scenario will be used.

# Switching the default scenario

The default scenario used can be switched via an HTTP call to the `/__scenario` endpoint.

```
curl http://localhost:9090/__scenario -X POST -d '{"scenario":"new-scenario"}' -H 'Content-Type: application/json'
```

# Examples and recipes

All of the examples below can be found in the provided example set of scenarios. See [Running the examples](#running-the-examples)

<details>
  <summary>Basic example</summary>

  In this basic example the response will always be the same array.

  ```js
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
  ```

</details>

<details>
  <summary>With fake statefulness</summary>

  ```js
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
  ```

  In this example an `/items` endpoint is provided. When performing a `GET` request to it the response will contain two items, since there should not be any cookie named `itemsposted` yet, and the first endpoint in the list will therefore not match.

  After performing a `POST` request with the body `{"name": "item three"}` the `itemsposted` cookie will be set to `'1'`.

  On the next `GET` request the first `GET` endpoint in the list will match since the incoming request now contains that cookie. From the browsers perspective the same endpoint is being queried, but the stored item is now present. On this `GET` request the cookie will also be set to an empty string as a means of cleanup.

  Using the `cookies`, it is possible to create a service that appears to be stateful, but it is pushing the statefulness to the client, via cookies.
</details>

<details>
  <summary>With function as matcher and data generator</summary>

  In this example a matcher function is used to check the path and query for certain values. Note that fejk can do this without defining a function, as illustrated in the second endpoint in the list.

  ```js
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
      // The function-based approach is primarily intended for fuzzy, or complex matching.
      {
        request(req) {
          return req.headers.host.match(/foo\d\.com/);
        },
        response: {
          status: 200
        }
      }
    ],
  };
  ```
</details>

<details>
  <summary>Authentication</summary>

  This example illustrates how you could add an authentication checker to an entire scenario.

  ```js
    module.exports = {
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
  ```
</details>

# Running the examples

Clone the repository, `yarn`, `yarn example` and start sending requests to the fejk!

Hit [the colors endpoint](http://localhost:9090/fejk/colors) to see the `defaults` mechanism in action.

Here's some JS to paste into your console, check out the network tab while running these in the order `GET` `POST` `GET`.

**GET**
```JavaScript
(function() {
var xhr = new XMLHttpRequest();
xhr.open("GET", "http://localhost:9090/fejk/items?scenario=items");

xhr.send();})();
```

**POST**
```JavaScript
(function() {
var data = JSON.stringify({
  "name": "item three"
});

var xhr = new XMLHttpRequest();
xhr.open("POST", "http://localhost:9090/fejk/items?scenario=items");
xhr.setRequestHeader("content-type", "application/json");

xhr.send(data);})();
```
